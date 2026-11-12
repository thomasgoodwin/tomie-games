import { randomBytes } from 'crypto';

// card 0 is always the queen, the other two are the decoys
const QUEEN = 0;
const SHUFFLE_MS = 9000;
// swaps sent right at the buzzer can arrive a little late because of latency
const SWAP_GRACE_MS = 400;
const ROOM_IDLE_MS = 10 * 60 * 1000;
const MAX_ROOMS = 1000;
const MAX_CREATES_PER_SOCKET = 20;
const MATCH_TARGETS = [2, 3];
const ROOM_ID_PATTERN = /^[A-Za-z0-9_-]{6,16}$/;
const PLAYER_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

const rooms = new Map();

const shuffled = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const isSlot = (value) => {
  return Number.isInteger(value) && value >= 0 && value <= 2;
};

const clamp = (value, min, max) => {
  return Math.min(max, Math.max(min, value));
};

const newRound = (room) => {
  clearTimeout(room.timer);
  room.timer = null;
  room.order = shuffled([0, 1, 2]);
  room.phase = room.players.length === 2 ? 'ready' : 'waiting';
  room.pick = null;
  room.shuffleEndsAt = null;
};

const stateFor = (room, playerIndex) => {
  const opponent = room.players[1 - playerIndex];
  return {
    roomId: room.id,
    phase: room.phase,
    role: playerIndex === room.dealerIndex ? 'dealer' : 'chooser',
    opponentConnected: !!opponent?.socketId,
    order: room.order,
    pick: room.pick,
    won: room.pick === null ? null : room.order[room.pick] === QUEEN,
    round: room.round,
    target: room.target,
    matchOver: room.matchWinner !== null,
    youWonMatch: room.matchWinner === playerIndex,
    conceded: room.conceded === null ? null : room.conceded === playerIndex ? 'you' : 'opponent',
    scores: {
      you: room.players[playerIndex].score,
      opponent: opponent ? opponent.score : 0,
    },
    remainingMs: room.phase === 'shuffling' ? Math.max(0, room.shuffleEndsAt - Date.now()) : null,
  };
};

export const setupMonte = (io) => {
  const nsp = io.of('/monte');

  const emitState = (room) => {
    room.players.forEach((player, index) => {
      if (player.socketId) {
        nsp.to(player.socketId).emit('monte:state', stateFor(room, index));
      }
    });
  };

  const detach = (socket) => {
    const room = rooms.get(socket.data.roomId);
    socket.data.roomId = null;
    if (!room) {
      return;
    }
    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) {
      return;
    }
    player.socketId = null;
    room.lastActive = Date.now();
    emitState(room);
  };

  const endShuffle = (room) => {
    room.timer = null;
    if (room.phase !== 'shuffling') {
      return;
    }
    room.phase = 'choosing';
    room.lastActive = Date.now();
    emitState(room);
  };

  setInterval(() => {
    const now = Date.now();
    for (const [id, room] of rooms) {
      const anyoneHere = room.players.some((p) => p.socketId);
      if (!anyoneHere && now - room.lastActive > ROOM_IDLE_MS) {
        clearTimeout(room.timer);
        rooms.delete(id);
      }
    }
  }, 60 * 1000).unref();

  nsp.on('connection', (socket) => {
    socket.data.creates = 0;

    // the room and seat this socket currently holds, if any
    const seat = () => {
      const room = rooms.get(socket.data.roomId);
      if (!room) {
        return null;
      }
      const index = room.players.findIndex((p) => p.socketId === socket.id);
      if (index === -1) {
        return null;
      }
      const opponent = room.players[1 - index];
      return {
        room,
        index,
        isDealer: index === room.dealerIndex,
        opponentSocketId: opponent?.socketId ?? null,
      };
    };

    socket.on('monte:create', (payload, ack) => {
      if (typeof ack !== 'function') {
        return;
      }
      const target = MATCH_TARGETS.includes(payload?.target) ? payload.target : MATCH_TARGETS[0];
      if (rooms.size >= MAX_ROOMS || socket.data.creates >= MAX_CREATES_PER_SOCKET) {
        ack({ error: 'busy' });
        return;
      }
      socket.data.creates++;
      let id;
      do {
        id = randomBytes(6).toString('base64url');
      } while (rooms.has(id));
      const room = {
        id,
        players: [],
        dealerIndex: 0,
        round: 1,
        target,
        matchWinner: null,
        conceded: null,
        timer: null,
        lastActive: Date.now(),
      };
      newRound(room);
      rooms.set(id, room);
      ack({ roomId: id });
    });

    socket.on('monte:join', (payload, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      const { roomId, playerId } = payload || {};
      if (!ROOM_ID_PATTERN.test(roomId || '') || !PLAYER_ID_PATTERN.test(playerId || '')) {
        reply({ error: 'bad-request' });
        return;
      }
      const room = rooms.get(roomId);
      if (!room) {
        reply({ error: 'not-found' });
        return;
      }

      if (socket.data.roomId && socket.data.roomId !== roomId) {
        detach(socket);
      }

      let player = room.players.find((p) => p.id === playerId);
      if (!player) {
        if (room.players.length >= 2) {
          reply({ error: 'full' });
          return;
        }
        player = { id: playerId, socketId: null, score: 0 };
        room.players.push(player);
        if (room.players.length === 2 && room.phase === 'waiting') {
          room.phase = 'ready';
        }
      }

      player.socketId = socket.id;
      socket.data.roomId = roomId;
      room.lastActive = Date.now();
      reply({ ok: true });
      emitState(room);
    });

    socket.on('monte:leave', () => {
      detach(socket);
    });

    socket.on('monte:deal', () => {
      const s = seat();
      if (!s || !s.isDealer || s.room.phase !== 'ready' || !s.opponentSocketId) {
        return;
      }
      const { room } = s;
      room.phase = 'shuffling';
      room.shuffleEndsAt = Date.now() + SHUFFLE_MS;
      room.timer = setTimeout(() => endShuffle(room), SHUFFLE_MS + SWAP_GRACE_MS);
      room.lastActive = Date.now();
      emitState(room);
    });

    socket.on('monte:swap', (payload) => {
      const s = seat();
      const { a, b } = payload || {};
      if (!s || !s.isDealer || s.room.phase !== 'shuffling' || !isSlot(a) || !isSlot(b) || a === b) {
        return;
      }
      const { room } = s;
      if (Date.now() > room.shuffleEndsAt + SWAP_GRACE_MS) {
        return;
      }
      [room.order[a], room.order[b]] = [room.order[b], room.order[a]];
      if (s.opponentSocketId) {
        nsp.to(s.opponentSocketId).emit('monte:swap', { a, b });
      }
    });

    socket.on('monte:drag', (payload) => {
      const s = seat();
      const { cardId, x, y } = payload || {};
      if (!s || !s.isDealer || s.room.phase !== 'shuffling' || !isSlot(cardId)) {
        return;
      }
      if (!Number.isFinite(x) || !Number.isFinite(y) || !s.opponentSocketId) {
        return;
      }
      nsp.to(s.opponentSocketId).volatile.emit('monte:drag', {
        cardId,
        x: clamp(x, -500, 1000),
        y: clamp(y, -500, 500),
      });
    });

    socket.on('monte:dragEnd', (payload) => {
      const s = seat();
      const { cardId } = payload || {};
      if (!s || !s.isDealer || !isSlot(cardId) || !s.opponentSocketId) {
        return;
      }
      nsp.to(s.opponentSocketId).emit('monte:dragEnd', { cardId });
    });

    socket.on('monte:pick', (payload) => {
      const s = seat();
      const { slot } = payload || {};
      if (!s || s.isDealer || s.room.phase !== 'choosing' || !isSlot(slot)) {
        return;
      }
      const { room } = s;
      room.pick = slot;
      room.phase = 'result';
      const winner = room.order[slot] === QUEEN ? s.index : room.dealerIndex;
      room.players[winner].score++;
      if (room.players[winner].score >= room.target) {
        room.matchWinner = winner;
      }
      room.lastActive = Date.now();
      emitState(room);
    });

    socket.on('monte:next', () => {
      const s = seat();
      if (!s || s.room.phase !== 'result' || s.room.matchWinner !== null) {
        return;
      }
      const { room } = s;
      room.dealerIndex = 1 - room.dealerIndex;
      room.round++;
      newRound(room);
      room.lastActive = Date.now();
      emitState(room);
    });

    socket.on('monte:concede', () => {
      const s = seat();
      if (!s || s.room.phase === 'waiting' || s.room.players.length < 2 || s.room.matchWinner !== null) {
        return;
      }
      const { room } = s;
      clearTimeout(room.timer);
      room.timer = null;
      room.matchWinner = 1 - s.index;
      room.conceded = s.index;
      room.phase = 'result';
      room.pick = null;
      room.lastActive = Date.now();
      emitState(room);
    });

    socket.on('monte:rematch', () => {
      const s = seat();
      if (!s || s.room.matchWinner === null) {
        return;
      }
      const { room } = s;
      room.players.forEach((p) => {
        p.score = 0;
      });
      room.matchWinner = null;
      room.conceded = null;
      room.dealerIndex = 1 - room.dealerIndex;
      room.round = 1;
      newRound(room);
      room.lastActive = Date.now();
      emitState(room);
    });

    socket.on('disconnect', () => {
      detach(socket);
    });
  });
};
