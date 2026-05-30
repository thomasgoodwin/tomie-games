import { useState, useEffect } from "react";
import { Button, Input, Group, Grid, GridItem } from "@chakra-ui/react";
import { motion, AnimatePresence } from "motion/react";
import { v4 as uuidv4 } from 'uuid';
import QuestionCard from "../../components/Custom/QuestionCard";
import PlayerList from "../../components/Custom/PlayerList";
import { isLocalhost, wordToHex } from "../../util";
import '../../App.css';

const POINT_VALUES = [100, 200, 300, 400];

const animation = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.2 }
};

const allColorsPicked = (playerList) =>
  Object.values(playerList).every(p => p.color !== undefined);

const BoardBuilder = ({ apiUrl, initialBoard, onSave, onBack }) => {
  const [boardName, setBoardName] = useState(initialBoard?.name || '');
  const [categories, setCategories] = useState(
    initialBoard?.data?.categories?.length ? initialBoard.data.categories : ['']
  );
  const [questions, setQuestions] = useState(initialBoard?.data?.questions || {});
  const [activeIdx, setActiveIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  const activeCat = categories[activeIdx] ?? '';

  const addCategory = () => {
    if (categories.length >= 8) return;
    const next = [...categories, ''];
    setCategories(next);
    setActiveIdx(next.length - 1);
  };

  const removeCategory = (idx) => {
    const cat = categories[idx];
    const next = categories.filter((_, i) => i !== idx);
    const nextQ = { ...questions };
    delete nextQ[cat];
    setCategories(next);
    setQuestions(nextQ);
    setActiveIdx(Math.max(0, Math.min(activeIdx, next.length - 1)));
  };

  const renameCat = (idx, value) => {
    const old = categories[idx];
    const next = [...categories];
    next[idx] = value;
    setCategories(next);
    if (old !== value && questions[old]) {
      const nextQ = { ...questions, [value]: questions[old] };
      delete nextQ[old];
      setQuestions(nextQ);
    }
  };

  const getQ = (cat, value, field) =>
    questions[cat]?.find(q => q.value === value)?.[field] ?? '';

  const setQ = (cat, value, field, text) => {
    setQuestions(prev => {
      const existing = prev[cat] || POINT_VALUES.map(v => ({ value: v, question: '', answer: '' }));
      return {
        ...prev,
        [cat]: existing.map(q => q.value === value ? { ...q, [field]: text } : q)
      };
    });
  };

  const canSave = boardName.trim().length > 0 &&
    categories.length > 0 &&
    categories.every(c => c.trim().length > 0);

  const handleSave = async () => {
    setSaving(true);
    const board = {
      id: initialBoard?.id || uuidv4(),
      name: boardName.trim(),
      data: {
        categories,
        questions: Object.fromEntries(
          categories.map(cat => [cat, POINT_VALUES.map(v => ({
            value: v,
            question: getQ(cat, v, 'question'),
            answer: getQ(cat, v, 'answer'),
          }))])
        )
      }
    };
    try {
      await fetch(`${apiUrl}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(board),
      });
    } finally {
      setSaving(false);
      onSave();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '700px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Button variant="outline" size="sm" onClick={onBack}>← Back</Button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Board Builder</h2>
      </div>

      <div>
        <div style={{ fontSize: '0.8rem', color: 'gray', marginBottom: '0.25rem' }}>Board Name</div>
        <Input
          value={boardName}
          placeholder="My Jeopardy Board"
          onChange={e => setBoardName(e.target.value)}
          variant="outline"
        />
      </div>

      <div>
        <div style={{ fontSize: '0.8rem', color: 'gray', marginBottom: '0.5rem' }}>Categories</div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {categories.map((cat, idx) => (
            <Button
              key={idx}
              size="sm"
              variant={idx === activeIdx ? 'solid' : 'outline'}
              onClick={() => setActiveIdx(idx)}
            >
              {cat || `Category ${idx + 1}`}
            </Button>
          ))}
          {categories.length < 8 && (
            <Button size="sm" variant="ghost" onClick={addCategory}>+ Add</Button>
          )}
        </div>

        <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Input
              value={activeCat}
              placeholder={`Category ${activeIdx + 1} name`}
              onChange={e => renameCat(activeIdx, e.target.value)}
              variant="outline"
              flex="1"
            />
            {categories.length > 1 && (
              <Button size="sm" variant="ghost" onClick={() => removeCategory(activeIdx)}>
                Remove
              </Button>
            )}
          </div>
          {activeCat && POINT_VALUES.map(value => (
            <div key={value} style={{ display: 'grid', gridTemplateColumns: '52px 1fr 1fr', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: '#06B6D4', fontSize: '0.95rem' }}>${value}</span>
              <Input
                size="sm"
                variant="outline"
                placeholder="Question..."
                value={getQ(activeCat, value, 'question')}
                onChange={e => setQ(activeCat, value, 'question', e.target.value)}
              />
              <Input
                size="sm"
                variant="outline"
                placeholder="Answer..."
                value={getQ(activeCat, value, 'answer')}
                onChange={e => setQ(activeCat, value, 'answer', e.target.value)}
              />
            </div>
          ))}
          {!activeCat && (
            <p style={{ color: 'gray', fontSize: '0.875rem' }}>Name this category above to add questions.</p>
          )}
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={!canSave || saving}
        background="#06B6D4"
        color="white"
        _hover={{ background: '#0891B2' }}
        height="50px"
        fontSize="1rem"
      >
        {saving ? 'Saving...' : 'Save Board'}
      </Button>
    </div>
  );
};

// ── Home Screen ───────────────────────────────────────────────────────────────

const HomeScreen = ({ apiUrl, onNewBoard, onPlay, onEdit }) => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/boards`)
      .then(r => r.ok ? r.json() : [])
      .catch(() => [])
      .then(data => { setBoards(data); setLoading(false); });
  }, []);

  const deleteBoard = async (id) => {
    await fetch(`${apiUrl}/boards/${id}`, { method: 'DELETE' });
    setBoards(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', textAlign: 'center' }}>Jeopardy</h1>
      <Button
        onClick={onNewBoard}
        height="50px"
        fontSize="1rem"
        background="#06B6D4"
        color="white"
        _hover={{ background: '#0891B2' }}
      >
        + New Board
      </Button>
      {loading ? (
        <p style={{ textAlign: 'center', color: 'gray' }}>Loading...</p>
      ) : boards.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'gray' }}>No saved boards yet. Create one above.</p>
      ) : (
        <>
          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Saved Boards</div>
          {boards.map(board => (
            <div key={board.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px' }}>
              <span style={{ fontWeight: '500' }}>{board.name}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button size="sm" background="#06B6D4" color="white" _hover={{ background: '#0891B2' }} onClick={() => onPlay(board.id)}>
                  Play
                </Button>
                <Button size="sm" variant="outline" onClick={() => onEdit(board.id)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => deleteBoard(board.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const Jeopardy = () => {
  const apiUrl = isLocalhost() ? import.meta.env.VITE_LOCAL_URL : import.meta.env.VITE_BACKEND_URL;
  const [view, setView] = useState('home'); // 'home' | 'builder' | 'setup' | 'game'
  const [editingBoard, setEditingBoard] = useState(null);
  const [activeBoard, setActiveBoard] = useState(null);
  const [gameState, setGameState] = useState({});
  const [playerList, setPlayerList] = useState({});
  const [newPlayerName, setNewPlayerName] = useState('');
  const [errorMessage, setErrorMessage] = useState(undefined);

  const loadBoard = async (id) => {
    const res = await fetch(`${apiUrl}/boards/${id}`);
    return res.json();
  };

  const buildGameState = (board) => {
    const state = {};
    POINT_VALUES.forEach(value => {
      board.data.categories.forEach(cat => {
        const q = board.data.questions[cat]?.find(q => q.value === value);
        state[`${cat}__${value}`] = {
          category: cat,
          question: q?.question || '',
          answer: q?.answer || '',
          value,
          active: true,
        };
      });
    });
    return state;
  };

  const handlePlay = async (boardId) => {
    const board = await loadBoard(boardId);
    setActiveBoard(board);
    setGameState(buildGameState(board));
    setPlayerList({});
    setNewPlayerName('');
    setErrorMessage(undefined);
    setView('setup');
  };

  const handleEdit = async (boardId) => {
    const board = await loadBoard(boardId);
    setEditingBoard(board);
    setView('builder');
  };

  const addPlayer = () => {
    if (!newPlayerName || playerList[newPlayerName] !== undefined) {
      setErrorMessage('Unique usernames are required.');
      return;
    }
    setErrorMessage(undefined);
    setPlayerList(prev => ({ ...prev, [newPlayerName]: { color: undefined, points: 0 } }));
    setNewPlayerName('');
  };

  const categories = activeBoard?.data?.categories || [];
  const playerCount = Object.keys(playerList).length;
  const maxPlayers = 4;

  return (
    <AnimatePresence mode="wait">
      {view === 'home' && (
        <motion.div key="home" {...animation}>
          <HomeScreen
            apiUrl={apiUrl}
            onNewBoard={() => { setEditingBoard(null); setView('builder'); }}
            onPlay={handlePlay}
            onEdit={handleEdit}
          />
        </motion.div>
      )}

      {view === 'builder' && (
        <motion.div key="builder" {...animation}>
          <BoardBuilder
            apiUrl={apiUrl}
            initialBoard={editingBoard}
            onSave={() => setView('home')}
            onBack={() => setView('home')}
          />
        </motion.div>
      )}

      {view === 'setup' && (
        <motion.div key="setup" {...animation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', width: '100%' }}>
              <h1 style={{ fontWeight: 'bold', fontSize: '2rem' }}>{activeBoard?.name}</h1>
              <h2 style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>Players</h2>
              <PlayerList players={playerList} setPlayerList={setPlayerList} />
              <Group attached w="full" maxW="sm">
                <Input
                  flex="1"
                  placeholder="Name..."
                  variant="outline"
                  value={newPlayerName}
                  disabled={playerCount >= maxPlayers}
                  onChange={e => setNewPlayerName(e.currentTarget.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && playerCount < maxPlayers && newPlayerName) addPlayer(); }}
                />
                <Button
                  bg="bg.subtle"
                  variant="outline"
                  disabled={playerCount >= maxPlayers || !newPlayerName}
                  onClick={addPlayer}
                >
                  Add
                </Button>
              </Group>
              {errorMessage && <div className="error-message">{errorMessage}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
            <Button variant="outline" onClick={() => setView('home')}>← Back</Button>
            <Button
              className="start-game-button"
              onClick={() => setView('game')}
              disabled={playerCount === 0 || !allColorsPicked(playerList)}
            >
              Start Game
            </Button>
          </div>
        </motion.div>
      )}

      {view === 'game' && (
        <motion.div key="game" {...animation}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0 2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{activeBoard?.name}</h1>
            <Button variant="outline" size="sm" onClick={() => setView('home')}>End Game</Button>
          </div>
          <div style={{ padding: '0 2rem' }}>
            <Grid templateColumns={`repeat(${playerCount}, 1fr)`} gap="6" marginBottom="3rem">
              {Object.keys(playerList).map(playerId => (
                <GridItem key={playerId}>
                  <div style={{ textAlign: 'center' }}>
                    <b style={{ fontSize: '2.5rem', color: wordToHex[playerList[playerId].color] }}>{playerId}</b>
                  </div>
                  <div style={{ fontSize: '1.75rem', textAlign: 'center' }}>
                    {playerList[playerId].points}
                  </div>
                </GridItem>
              ))}
            </Grid>
            <div className="game-dashboard">
              <Grid templateColumns={`repeat(${categories.length}, 1fr)`} gap="4">
                {categories.map(cat => (
                  <GridItem key={cat}>
                    <b style={{ fontSize: '1rem' }}>{cat}</b>
                  </GridItem>
                ))}
                {Object.keys(gameState).map(questionId => (
                  <GridItem key={questionId}>
                    <QuestionCard
                      questionId={questionId}
                      question={gameState[questionId]}
                      players={playerList}
                      setPlayerList={setPlayerList}
                      disabled={!gameState[questionId].active}
                      gameState={gameState}
                      setGameState={setGameState}
                    />
                  </GridItem>
                ))}
              </Grid>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Jeopardy;
