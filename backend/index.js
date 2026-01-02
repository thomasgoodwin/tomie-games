import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import http from "http";
import { Server } from "socket.io";

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
    url TEXT NOT NULL
  )
`).run();

app.use(express.json());

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  allowedHeaders: ["Content-Type", "X-Queue-Secret"],
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
}));

// Rate limiter (prevent bots)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,             // max 30 requests per IP per window
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

// Secret validation middleware
const requireSecret = (req, res, next) => {
  const clientSecret = req.get('X-Queue-Secret');
  if (clientSecret !== secret) {
    return res.status(403).send('No secret or bad secret');
  }
  next();
};

// Add a song
app.post('/songs', requireSecret, (req, res) => {
  console.log(req.body)
  const { id, title, url } = req.body;

  if (!id || !title || !url) {
    return res.status(400).send('Bad parameters');
  }

  try {
    db.prepare('INSERT INTO songs (id, title, url) VALUES (?, ?, ?)').run(id, title, url);
    io.to(secret).emit("queue:updated", {
      type: "song-added",
      song: {
        id,
        title,
        url
      }
    });
    res.send('Track added successfully');
  } catch (e) {
    console.error(e);
    res.status(500).send('Internal Error');
  }
});

// Get the queue
app.get('/songs', requireSecret, (req, res) => {
  try {
    const songs = db.prepare('SELECT * FROM songs').all();
    res.json(songs);
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