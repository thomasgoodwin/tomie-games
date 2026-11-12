import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@chakra-ui/react";
import { AnimatePresence, animate, motion, motionValue } from "motion/react";
import { getMonteSocket, getPlayerId } from "./monteSocket";
import "./Monte.css";

const CARD_W = 110;
const CARD_H = 154;
const GAP = 36;
const BOARD_W = CARD_W * 3 + GAP * 2;
const CARD_TOP = 44;
const BOARD_H = CARD_H + CARD_TOP * 2;
const ARC = 30;
const SHUFFLE_MS = 9000;
const SWAP_TRANSITION = { duration: 0.22, ease: "easeInOut" };
const DRAG_SEND_MS = 33;
const TOP_Z = "1000000";
// number key swapping is turned off for now, dragging is the only way to swap
const KEYBOARD_SWAPS = false;
const MATCH_TARGETS = [2, 3];

// card 0 is always the queen, matching the server
const CARDS = [
  { rank: "Q", suit: "♥", color: "#c8102e" },
  { rank: "K", suit: "♠", color: "#111" },
  { rank: "J", suit: "♣", color: "#111" },
];

const ERROR_TEXT = {
  "not-found": "This game doesn't exist. It may have expired.",
  "full": "This game already has two players.",
  "bad-request": "That game link looks broken.",
};

const clamp = (value, min, max) => {
  return Math.min(max, Math.max(min, value));
};

const slotX = (slot) => {
  return slot * (CARD_W + GAP);
};

const nearestSlot = (x) => {
  return clamp(Math.round(x / (CARD_W + GAP)), 0, 2);
};

const Card = ({ card, x, y, elRef, faceUp, queenHint, ring, clickable, draggable, dragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClick }) => {
  const classes = ["monte-card"];
  if (clickable) {
    classes.push("monte-card-clickable");
  }
  if (draggable) {
    classes.push(dragging ? "monte-card-dragging" : "monte-card-draggable");
  }

  return <motion.div
    ref={elRef}
    className={classes.join(" ")}
    style={{ x, y, left: 0, top: CARD_TOP, width: CARD_W, height: CARD_H }}
    onPointerDown={onPointerDown}
    onPointerMove={onPointerMove}
    onPointerUp={onPointerUp}
    onPointerCancel={onPointerCancel}
    onClick={onClick}
  >
    <div className="monte-card-lift">
      <div className="monte-card-inner" style={{ transform: faceUp ? "rotateY(0deg)" : "rotateY(180deg)" }}>
        <div
          className="monte-card-face"
          style={{ color: card.color, boxShadow: ring ? `0 0 0 5px ${ring}, 0 4px 14px rgba(0,0,0,.45)` : undefined }}
        >
          <div className="monte-corner monte-corner-top"><span>{card.rank}</span><span>{card.suit}</span></div>
          <div className="monte-pip">{card.suit}</div>
          <div className="monte-corner monte-corner-bottom"><span>{card.rank}</span><span>{card.suit}</span></div>
        </div>
        <div className="monte-card-back">
          {queenHint && <span className="monte-queen-hint">Q</span>}
        </div>
      </div>
    </div>
  </motion.div>
};

const KeyBox = ({ value, color }) => {
  return <span className="monte-key" style={{ borderColor: color, color }}>
    {value === null ? "" : value + 1}
  </span>
};

const MonteLobby = () => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [target, setTarget] = useState(MATCH_TARGETS[0]);

  const createGame = () => {
    setBusy(true);
    setError(null);
    getMonteSocket().timeout(5000).emit("monte:create", { target }, (err, res) => {
      setBusy(false);
      if (err) {
        setError("Couldn't reach the game server.");
        return;
      }
      if (!res?.roomId) {
        setError("Too many games are running right now, try again in a bit.");
        return;
      }
      navigate(`/monte/${res.roomId}`);
    });
  };

  return <div className="monte-page">
    <h1 className="monte-title">3 Card Monte</h1>
    <div className="monte-rules">
      <p>Two players. One deals, one chooses.</p>
      <p>The dealer has 9 seconds to shuffle the cards around by dragging them onto each other.</p>
      <p>The chooser has to find the queen of hearts. Roles swap every round.</p>
    </div>
    <div className="monte-target-picker">
      {MATCH_TARGETS.map((value) => <Button
        key={value}
        variant={target === value ? "solid" : "outline"}
        onClick={() => setTarget(value)}
      >
        First to {value} wins
      </Button>)}
    </div>
    <Button onClick={createGame} loading={busy} colorPalette="green" size="lg">Create game</Button>
    {error && <div className="monte-error">{error}</div>}
  </div>
};

const MonteGame = ({ roomId }) => {
  const socket = useMemo(() => getMonteSocket(), []);
  const [game, setGame] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(socket.connected);
  const [order, setOrder] = useState([0, 1, 2]);
  const [queued, setQueued] = useState(null);
  const [flash, setFlash] = useState(null);
  const [remainingMs, setRemainingMs] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [scale, setScale] = useState(1);
  const [copied, setCopied] = useState(false);
  const [confirmingConcede, setConfirmingConcede] = useState(false);

  const posRef = useRef(null);
  if (!posRef.current) {
    posRef.current = [0, 1, 2].map((cardId) => ({ x: motionValue(slotX(cardId)), y: motionValue(0) }));
  }
  const pos = posRef.current;

  const gameRef = useRef(null);
  const orderRef = useRef([0, 1, 2]);
  const dragRef = useRef(null);
  const queuedRef = useRef(null);
  const flashIdRef = useRef(0);
  const zRef = useRef(1);
  const cardEls = useRef([]);
  const shuffleEndRef = useRef(0);
  const shuffleActiveRef = useRef(false);
  const scaleRef = useRef(1);
  const lastDragSendRef = useRef(0);

  const moveCard = useCallback((cardId, slot, lift) => {
    const { x, y } = pos[cardId];
    const el = cardEls.current[cardId];
    if (el) {
      el.style.zIndex = String(++zRef.current);
    }
    animate(x, slotX(slot), SWAP_TRANSITION);
    const yNow = y.get();
    if (lift === 0 || Math.abs(yNow) > 2) {
      animate(y, 0, SWAP_TRANSITION);
    } else {
      animate(y, [yNow, lift * ARC, 0], SWAP_TRANSITION);
    }
  }, [pos]);

  const placeAll = useCallback((nextOrder, instant) => {
    nextOrder.forEach((cardId, slot) => {
      if (instant) {
        pos[cardId].x.jump(slotX(slot));
        pos[cardId].y.jump(0);
      } else {
        moveCard(cardId, slot, 0);
      }
    });
  }, [pos, moveCard]);

  const applySwap = useCallback((a, b) => {
    const next = [...orderRef.current];
    const cardA = next[a];
    const cardB = next[b];
    next[a] = cardB;
    next[b] = cardA;
    orderRef.current = next;
    setOrder(next);
    // the card heading right arcs up and the one heading left arcs down in front of it
    const rightward = b > a ? { cardId: cardA, slot: b } : { cardId: cardB, slot: a };
    const leftward = b > a ? { cardId: cardB, slot: a } : { cardId: cardA, slot: b };
    moveCard(rightward.cardId, rightward.slot, -1);
    moveCard(leftward.cardId, leftward.slot, 1);
  }, [moveCard]);

  const endDrag = useCallback(() => {
    const drag = dragRef.current;
    dragRef.current = null;
    setDraggingId(null);
    if (!drag) {
      return null;
    }
    try {
      drag.el.releasePointerCapture(drag.pointerId);
    } catch {
      // capture may already be gone
    }
    return drag;
  }, []);

  const dealerSwap = useCallback((a, b) => {
    const drag = dragRef.current;
    if (drag && (orderRef.current[a] === drag.cardId || orderRef.current[b] === drag.cardId)) {
      endDrag();
    }
    applySwap(a, b);
    socket.emit("monte:swap", { a, b });
  }, [applySwap, endDrag, socket]);

  const stopShuffleInput = useCallback(() => {
    const drag = endDrag();
    if (drag) {
      moveCard(drag.cardId, orderRef.current.indexOf(drag.cardId), 0);
      socket.emit("monte:dragEnd", { cardId: drag.cardId });
    }
    queuedRef.current = null;
    setQueued(null);
    setFlash(null);
  }, [endDrag, moveCard, socket]);

  const handleState = useCallback((state) => {
    const prev = gameRef.current;
    gameRef.current = state;
    setGame(state);
    if (state.phase === "shuffling") {
      shuffleEndRef.current = performance.now() + state.remainingMs;
    }

    const phaseChanged = !prev || prev.phase !== state.phase || prev.round !== state.round;
    if (phaseChanged) {
      endDrag();
      queuedRef.current = null;
      setQueued(null);
      setFlash(null);
    }

    // mid shuffle the dealer's own order is ahead of the server's, so only reconcile at phase boundaries
    const dealerMidShuffle = !phaseChanged && state.role === "dealer" && state.phase === "shuffling";
    const differs = state.order.some((cardId, slot) => cardId !== orderRef.current[slot]);
    if (phaseChanged || (differs && !dealerMidShuffle)) {
      orderRef.current = [...state.order];
      setOrder(orderRef.current);
      placeAll(orderRef.current, !prev);
    }
  }, [endDrag, placeAll]);

  useEffect(() => {
    const playerId = getPlayerId();
    const join = () => {
      socket.emit("monte:join", { roomId, playerId }, (res) => {
        setError(res?.error ?? null);
      });
    };
    const onConnect = () => {
      setConnected(true);
      join();
    };
    const onDisconnect = () => {
      setConnected(false);
    };
    const onSwap = ({ a, b }) => {
      applySwap(a, b);
    };
    const onDrag = ({ cardId, x, y }) => {
      const el = cardEls.current[cardId];
      if (el) {
        el.style.zIndex = TOP_Z;
      }
      pos[cardId].x.jump(x);
      pos[cardId].y.jump(y);
    };
    const onDragEnd = ({ cardId }) => {
      moveCard(cardId, orderRef.current.indexOf(cardId), 0);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onDisconnect);
    socket.on("monte:state", handleState);
    socket.on("monte:swap", onSwap);
    socket.on("monte:drag", onDrag);
    socket.on("monte:dragEnd", onDragEnd);
    if (socket.connected) {
      join();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onDisconnect);
      socket.off("monte:state", handleState);
      socket.off("monte:swap", onSwap);
      socket.off("monte:drag", onDrag);
      socket.off("monte:dragEnd", onDragEnd);
      socket.emit("monte:leave");
    };
  }, [socket, roomId, pos, applySwap, moveCard, handleState]);

  const phase = game?.phase;
  const round = game?.round;
  useEffect(() => {
    if (phase !== "shuffling") {
      shuffleActiveRef.current = false;
      setRemainingMs(null);
      return;
    }
    const tick = () => {
      const left = Math.max(0, shuffleEndRef.current - performance.now());
      setRemainingMs(left);
      const active = left > 0 && gameRef.current?.role === "dealer";
      if (shuffleActiveRef.current && !active) {
        stopShuffleInput();
      }
      shuffleActiveRef.current = active;
    };
    tick();
    const id = setInterval(tick, 50);
    return () => {
      clearInterval(id);
    };
  }, [phase, round, stopShuffleInput]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const current = gameRef.current;
      if (!current || current.role !== "dealer" || e.repeat || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }
      if (current.phase === "ready" && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        socket.emit("monte:deal");
        return;
      }
      if (!KEYBOARD_SWAPS || !shuffleActiveRef.current || !["1", "2", "3"].includes(e.key)) {
        return;
      }
      e.preventDefault();
      const slot = Number(e.key) - 1;
      if (queuedRef.current === null) {
        queuedRef.current = slot;
        setQueued(slot);
        return;
      }
      const first = queuedRef.current;
      queuedRef.current = null;
      setQueued(null);
      flashIdRef.current++;
      setFlash({ a: first, b: slot, ok: first !== slot, id: flashIdRef.current });
      if (first !== slot) {
        dealerSwap(first, slot);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [socket, dealerSwap]);

  useEffect(() => {
    const update = () => {
      const next = Math.min(1, (window.innerWidth - 32) / BOARD_W);
      scaleRef.current = next;
      setScale(next);
    };
    update();
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
    };
  }, []);

  const onCardPointerDown = (e, cardId) => {
    if (!shuffleActiveRef.current || dragRef.current || e.button !== 0) {
      return;
    }
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const { x, y } = pos[cardId];
    x.stop();
    y.stop();
    dragRef.current = {
      cardId,
      el,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: x.get(),
      originY: y.get(),
    };
    el.style.zIndex = TOP_Z;
    setDraggingId(cardId);
  };

  const onCardPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) {
      return;
    }
    const nextX = clamp(drag.originX + (e.clientX - drag.startX) / scaleRef.current, -CARD_W / 2, BOARD_W - CARD_W / 2);
    const nextY = clamp(drag.originY + (e.clientY - drag.startY) / scaleRef.current, -CARD_TOP, CARD_TOP);
    pos[drag.cardId].x.set(nextX);
    pos[drag.cardId].y.set(nextY);
    const now = performance.now();
    if (now - lastDragSendRef.current >= DRAG_SEND_MS) {
      lastDragSendRef.current = now;
      socket.emit("monte:drag", { cardId: drag.cardId, x: nextX, y: nextY });
    }
  };

  const onCardPointerUp = (e) => {
    const current = dragRef.current;
    if (!current || e.pointerId !== current.pointerId) {
      return;
    }
    const drag = endDrag();
    const from = orderRef.current.indexOf(drag.cardId);
    const to = nearestSlot(pos[drag.cardId].x.get());
    if (e.type === "pointerup" && to !== from) {
      applySwap(from, to);
      socket.emit("monte:swap", { a: from, b: to });
    } else {
      moveCard(drag.cardId, from, 0);
      socket.emit("monte:dragEnd", { cardId: drag.cardId });
    }
  };

  const pickCard = (cardId) => {
    if (game?.role !== "chooser" || game.phase !== "choosing") {
      return;
    }
    socket.emit("monte:pick", { slot: orderRef.current.indexOf(cardId) });
  };

  const concede = () => {
    if (!confirmingConcede) {
      setConfirmingConcede(true);
      setTimeout(() => setConfirmingConcede(false), 3000);
      return;
    }
    setConfirmingConcede(false);
    socket.emit("monte:concede");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  if (error) {
    return <div className="monte-page">
      <h1 className="monte-title">3 Card Monte</h1>
      <div className="monte-error">{ERROR_TEXT[error] ?? "Something went wrong."}</div>
      <a className="monte-link" href="/monte">Start a new game</a>
    </div>
  }

  if (!game) {
    return <div className="monte-page">
      <h1 className="monte-title">3 Card Monte</h1>
      <div className="monte-status">{connected ? "Joining game…" : "Connecting to the game server…"}</div>
    </div>
  }

  const isDealer = game.role === "dealer";
  const faceUp = phase === "waiting" || phase === "ready" || phase === "result";
  const shuffleActive = isDealer && phase === "shuffling" && remainingMs > 0;

  let status = "";
  if (phase === "waiting") {
    status = "Waiting for someone to join. Send them the link.";
  } else if (phase === "ready") {
    status = isDealer ? "You're the dealer. Show them the queen, then deal." : "You're the chooser. Keep your eye on the queen of hearts.";
  } else if (phase === "shuffling") {
    status = isDealer ? "Shuffle! Drag the cards onto each other to swap them." : "Watch closely…";
  } else if (phase === "choosing") {
    status = isDealer ? "Time's up. Waiting for the chooser to pick…" : "Where's the queen? Click a card.";
  } else if (phase === "result") {
    if (isDealer) {
      status = game.won ? "They found the queen." : "You fooled them!";
    } else {
      status = game.won ? "You found the queen!" : "Missed! That's not the queen.";
    }
  }
  if (game.conceded === "you") {
    status = "You conceded. They win the match.";
  } else if (game.conceded === "opponent") {
    status = "Your opponent conceded. You win the match!";
  } else if (game.matchOver) {
    status += game.youWonMatch ? " You win the match!" : " They win the match.";
  }

  const ringFor = (cardId) => {
    if (phase !== "result" || order[game.pick] !== cardId) {
      return null;
    }
    return game.won ? "#3ddc84" : "#ff4d4d";
  };

  return <div className="monte-page">
    <h1 className="monte-title">3 Card Monte</h1>

    <div className="monte-scoreboard">
      <span className="monte-role">{isDealer ? "Dealer" : "Chooser"}</span>
      <span>Round {game.round}</span>
      <span>First to {game.target}</span>
      <span>You {game.scores.you} · {game.scores.opponent} Them</span>
    </div>

    {!connected && <div className="monte-banner">Reconnecting to the server…</div>}
    {connected && phase !== "waiting" && !game.opponentConnected &&
      <div className="monte-banner">Your opponent disconnected. They can rejoin with the same link.</div>}

    <div className="monte-status">{status}</div>

    {phase === "waiting" && <div className="monte-share">
      <input className="monte-share-input" readOnly value={window.location.href} onFocus={(e) => e.target.select()} />
      <Button size="sm" onClick={copyLink}>{copied ? "Copied" : "Copy link"}</Button>
    </div>}

    {KEYBOARD_SWAPS && <div className="monte-keys">
      {isDealer && queued !== null && <div className="monte-key-row">
        <KeyBox value={queued} color="#f3f3f3" />
        <KeyBox value={null} color="rgba(255,255,255,.35)" />
      </div>}
      <AnimatePresence>
        {isDealer && queued === null && flash && <motion.div
          key={flash.id}
          className="monte-key-row"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <KeyBox value={flash.a} color={flash.ok ? "#3ddc84" : "#ff4d4d"} />
          <KeyBox value={flash.b} color={flash.ok ? "#3ddc84" : "#ff4d4d"} />
        </motion.div>}
      </AnimatePresence>
    </div>}

    <div className="monte-table">
      <div style={{ width: BOARD_W * scale, height: BOARD_H * scale }}>
        <div className="monte-board" style={{ width: BOARD_W, height: BOARD_H, transform: `scale(${scale})` }}>
          {[0, 1, 2].map((slot) => <div key={slot} className="monte-slot" style={{ left: slotX(slot), top: CARD_TOP, width: CARD_W, height: CARD_H }}>
            <span className="monte-slot-label">{slot + 1}</span>
          </div>)}
          {CARDS.map((card, cardId) => <Card
            key={cardId}
            card={card}
            x={pos[cardId].x}
            y={pos[cardId].y}
            elRef={(el) => {
              cardEls.current[cardId] = el;
            }}
            faceUp={faceUp}
            queenHint={isDealer && cardId === 0}
            ring={ringFor(cardId)}
            clickable={!isDealer && phase === "choosing"}
            draggable={shuffleActive}
            dragging={draggingId === cardId}
            onPointerDown={(e) => onCardPointerDown(e, cardId)}
            onPointerMove={onCardPointerMove}
            onPointerUp={onCardPointerUp}
            onPointerCancel={onCardPointerUp}
            onClick={() => pickCard(cardId)}
          />)}
        </div>
      </div>
    </div>

    <div className="monte-timer">
      {phase === "shuffling" && remainingMs !== null && <>
        <div className="monte-timer-bar" style={{ width: `${(remainingMs / SHUFFLE_MS) * 100}%` }} />
        <span className="monte-timer-text">{(remainingMs / 1000).toFixed(1)}s</span>
      </>}
    </div>

    {phase === "ready" && isDealer && <Button colorPalette="green" size="lg" onClick={() => socket.emit("monte:deal")}>
      Deal (Space)
    </Button>}
    {phase === "result" && !game.matchOver && <Button colorPalette="green" size="lg" onClick={() => socket.emit("monte:next")}>
      Next round (swap roles)
    </Button>}
    {game.matchOver && <Button colorPalette="green" size="lg" onClick={() => socket.emit("monte:rematch")}>
      Rematch
    </Button>}

    {isDealer && (phase === "ready" || phase === "shuffling") && <div className="monte-help">
      Drag a card onto another spot to swap them. The gold Q only shows on your screen.
    </div>}

    {phase !== "waiting" && !game.matchOver && <Button
      size="sm"
      variant={confirmingConcede ? "solid" : "outline"}
      colorPalette="red"
      onClick={concede}
    >
      {confirmingConcede ? "Click again to concede" : "Concede"}
    </Button>}
  </div>
};

const Monte = () => {
  const { roomId } = useParams();
  if (!roomId) {
    return <MonteLobby />;
  }
  return <MonteGame key={roomId} roomId={roomId} />;
};

export default Monte;
