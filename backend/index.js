import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import http from "http";
import { Server } from "socket.io";
import { generateAdminToken, hashToken } from './auth.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;
const secret = process.env.SECRET;

// Initialize DB
const db = new Database('mydatabase.db');
db.prepare(`
  CREATE TABLE IF NOT EXISTS songs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    position INTEGER NOT NULL UNIQUE
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT NOT NULL UNIQUE
  )
`).run();

app.use(express.json());

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  allowedHeaders: ["Content-Type", "X-Queue-Secret"],
  methods: ["GET", "POST", "DELETE", "OPTIONS", "PATCH"],
}));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many requests, please try again later.',
});
app.use(limiter);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }
});

io.use((socket, next) => {
  const incomingSocketSecret = socket.handshake.auth.secret;
  if (incomingSocketSecret !== secret) {
    return next(new Error("Unauthorized"));
  }
  next();
});

io.on("connection", (socket) => {
  const secret = socket.handshake.auth.secret;
  socket.join(secret);
});

const requireSecret = (req, res, next) => {
  const clientSecret = req.get('X-Queue-Secret');
  if (clientSecret !== secret) {
    return res.status(403).send('No secret or bad secret');
  }
  next();
};

// Add a song
app.post('/songs', requireSecret, (req, res) => {
  const { id, title, url } = req.body;

  if (!id || !title || !url) {
    return res.status(400).send('Bad parameters');
  }

  try {
    const nextPosition = db
      .prepare('SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM songs')
      .get().pos;

    db.prepare(
      'INSERT INTO songs (id, title, url, position) VALUES (?, ?, ?, ?)'
    ).run(id, title, url, nextPosition);

    io.to(secret).emit("queue:updated", {
      type: "song-added",
      song: { id, title, url }
    });

    res.send('Track added successfully');
  } catch (e) {
    console.error(e);
    res.status(500).send('Internal Error');
  }
});

app.get("/admin/:id", requireSecret, (req, res) => {
  const token = req.params.id;
  const tokenHash = hashToken(token);
  const admin = db
    .prepare(`SELECT token_hash FROM admins LIMIT 1`)
    .get();

  const isIdAdmin = admin && admin.token_hash === tokenHash;

  const howManyAdminsExist = db.prepare(`
    SELECT COUNT(*) AS admin_count
    FROM admins
  `).get();

  res.json({
    isAdmin: isIdAdmin,
    adminExists: howManyAdminsExist.admin_count > 0,
  });
});

app.post("/admin/create", requireSecret, (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).send('Bad parameters');
  }
  const tokenHash = hashToken(id);
  db.prepare('DELETE FROM admins').run();
  db.prepare(
    "INSERT INTO admins (token_hash) VALUES (?)"
  ).run(tokenHash);

  io.to(secret).emit("queue:updated", {
    type: "admin-changed",
    newId: id
  });
});

app.delete("/admin", requireSecret, (req, res) => {
  db.prepare('DELETE FROM admins').run();
  io.to(secret).emit("queue:updated", {
    type: "admin-changed",
    newId: null
  });
  res.send(200);
});

// Get the queue
app.get('/songs', requireSecret, (req, res) => {
  try {
    const songs = db
      .prepare('SELECT * FROM songs ORDER BY position ASC')
      .all();
    res.json(songs);
  } catch (e) {
    console.error(e);
    res.status(500).send('Internal Error');
  }
});

// Swap two songs in the queue
app.patch('/songs', requireSecret, (req, res) => {
  const { currentIndex, newIndex } = req.body;

  if (currentIndex === newIndex) {
    return res.send('No change');
  }

  try {
    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE songs SET position = -1 WHERE position = ?
      `).run(currentIndex);

      db.prepare(`
        UPDATE songs SET position = ? WHERE position = ?
      `).run(currentIndex, newIndex);

      db.prepare(`
        UPDATE songs SET position = ? WHERE position = -1
      `).run(newIndex);
    });
    tx();

    io.to(secret).emit("queue:updated", {
      type: "queue-reordered",
      currentIndex,
      newIndex 
    });

    res.send('Queue updated');
  } catch (e) {
    console.error(e);
    res.status(500).send('Internal Error');
  }
});

// Remove a song by ID
app.delete('/songs/:id', requireSecret, (req, res) => {
  const songId = req.params.id;
  try {
    const result = db.prepare('DELETE FROM songs WHERE id = ?').run(songId);
    if (result.changes === 0) {
      return res.status(404).send('No song found with that ID');
    }
    io.to(secret).emit("queue:updated", {
      type: "song-removed",
      id: songId
    });
    res.send('Track removed successfully');
  } catch (e) {
    console.error(e);
    res.status(500).send('Internal Error');
  }
});

// Clear all songs
app.delete('/songs', requireSecret, (req, res) => {
  try {
    db.prepare('DELETE FROM songs').run();
    io.to(secret).emit("queue:updated", {
      type: "all-songs-removed"
    });
    res.send('All tracks cleared');
  } catch (e) {
    console.error(e);
    res.status(500).send('Internal Error');
  }
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});