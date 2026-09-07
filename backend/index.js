import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import http from "http";
import { Server } from "socket.io";
import { generateAdminToken, hashToken } from './auth.js';
import { ensureDirectoryTable, syncDirectory } from './directorySync.js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT NOT NULL UNIQUE
  )
`).run();

// Safety net: scripts/build-karaoke-index.mjs already syncs the directory
// into the database directly, but this covers a fresh clone/deploy where the
// committed database predates the committed karaoke-index.json.
ensureDirectoryTable(db);
const directoryPath = path.join(__dirname, 'karaoke-index.json');
if (existsSync(directoryPath)) {
  const directorySongs = JSON.parse(readFileSync(directoryPath, 'utf8'));
  const currentCount = db.prepare('SELECT COUNT(*) AS count FROM directory_songs').get().count;
  if (currentCount !== directorySongs.length) {
    syncDirectory(db, directorySongs);
    console.log(`Synced ${directorySongs.length} songs into the queue directory.`);
  }
}

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
  // /directory gets its own, more generous limiter below: live search-as-
  // you-type easily burns through a shared 30/min budget on its own, which
  // was silently starving other requests (like actually adding a song).
  skip: (req) => req.path === '/directory',
});
app.use(limiter);

const directoryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Too many requests, please try again later.',
});

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

// Search the karaoke directory (paginated). The same song is often uploaded
// by several of the scraped channels, so rows are grouped by title+artist;
// each group's "first" variant (lowest id) is what a plain Add uses, and the
// full variant list (one per channel) is included for the frontend's
// per-channel expand.
app.get('/directory', directoryLimiter, requireSecret, (req, res) => {
  const q = (req.query.q || '').trim();
  const languages = (req.query.languages || '').split(',').map((l) => l.trim()).filter(Boolean);
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
  const offset = (page - 1) * pageSize;

  const conditions = [];
  const params = [];
  if (q) {
    conditions.push('(title LIKE ? OR artist LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (languages.length > 0) {
    conditions.push(`language IN (${languages.map(() => '?').join(',')})`);
    params.push(...languages);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const total = db
      .prepare(`SELECT COUNT(*) AS count FROM (SELECT 1 FROM directory_songs ${where} GROUP BY LOWER(title), LOWER(artist))`)
      .get(...params).count;

    const groups = db
      .prepare(`
        SELECT g.firstId, g.variantCount, d.title, d.artist, d.link, d.views
        FROM (
          SELECT MIN(id) AS firstId, COUNT(*) AS variantCount
          FROM directory_songs ${where}
          GROUP BY LOWER(title), LOWER(artist)
        ) g
        JOIN directory_songs d ON d.id = g.firstId
        ORDER BY d.title COLLATE NOCASE ASC
        LIMIT ? OFFSET ?
      `)
      .all(...params, pageSize, offset);

    const variantsByGroup = db.prepare(`
      SELECT id, title, artist, link, views, channel
      FROM directory_songs
      WHERE LOWER(title) = LOWER(?) AND LOWER(artist) = LOWER(?)
      ORDER BY id ASC
    `);
    const results = groups.map((group) => ({
      title: group.title,
      artist: group.artist,
      link: group.link,
      views: group.views,
      variantCount: group.variantCount,
      variants: group.variantCount > 1 ? variantsByGroup.all(group.title, group.artist) : undefined,
    }));

    res.json({ results, total, page, pageSize });
  } catch (e) {
    console.error(e);
    res.status(500).send('Internal Error');
  }
});

// Distinct languages actually present in the directory, for the search/random
// language checkboxes. English sorts first since it's the default selection.
app.get('/directory/languages', directoryLimiter, requireSecret, (req, res) => {
  try {
    const rows = db
      .prepare(`
        SELECT DISTINCT language FROM directory_songs
        WHERE language IS NOT NULL
        ORDER BY CASE WHEN language = 'English' THEN 0 ELSE 1 END, language ASC
      `)
      .all();
    res.json(rows.map((r) => r.language));
  } catch (e) {
    console.error(e);
    res.status(500).send('Internal Error');
  }
});

// Each reroll narrows the pool to a smaller top slice by views, so repeated
// rerolls bias toward increasingly well known songs instead of just reshuffling
// the same odds.
const RANDOM_PICK_TOP_PERCENTILES = [20, 10, 5, 2.5, 1.25];

// Pick one random song from the directory, grouped the same way as /directory
// so a group's representative (lowest id) link/title is what gets returned.
app.get('/directory/random', directoryLimiter, requireSecret, (req, res) => {
  try {
    const rerollIndex = Math.min(
      Math.max(parseInt(req.query.reroll, 10) || 0, 0),
      RANDOM_PICK_TOP_PERCENTILES.length - 1
    );
    const topPercent = RANDOM_PICK_TOP_PERCENTILES[rerollIndex];

    const languages = (req.query.languages || '').split(',').map((l) => l.trim()).filter(Boolean);
    const where = languages.length > 0 ? `WHERE language IN (${languages.map(() => '?').join(',')})` : '';

    const groups = db
      .prepare(`
        SELECT g.firstId, g.variantCount, d.views
        FROM (
          SELECT MIN(id) AS firstId, COUNT(*) AS variantCount
          FROM directory_songs ${where}
          GROUP BY LOWER(title), LOWER(artist)
        ) g
        JOIN directory_songs d ON d.id = g.firstId
        ORDER BY d.views DESC
      `)
      .all(...languages);

    if (groups.length === 0) {
      return res.status(404).send('Directory is empty');
    }

    const poolSize = Math.max(1, Math.ceil(groups.length * (topPercent / 100)));
    const pool = groups.slice(0, poolSize);
    const picked = pool[Math.floor(Math.random() * pool.length)];

    const song = db
      .prepare('SELECT title, artist, link, views FROM directory_songs WHERE id = ?')
      .get(picked.firstId);

    res.json({
      title: song.title,
      artist: song.artist,
      link: song.link,
      views: song.views,
      variantCount: picked.variantCount,
    });
  } catch (e) {
    console.error(e);
    res.status(500).send('Internal Error');
  }
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

// Boards (no secret required — public game content)
app.get('/boards', (req, res) => {
  const boards = db.prepare('SELECT id, name FROM boards ORDER BY rowid DESC').all();
  res.json(boards);
});

app.get('/boards/:id', (req, res) => {
  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.id);
  if (!board) return res.status(404).send('Not found');
  res.json({ ...board, data: JSON.parse(board.data) });
});

app.post('/boards', (req, res) => {
  const { id, name, data } = req.body;
  if (!id || !name || !data) return res.status(400).send('Bad parameters');
  db.prepare('INSERT OR REPLACE INTO boards (id, name, data) VALUES (?, ?, ?)').run(id, name, JSON.stringify(data));
  res.json({ id, name });
});

app.delete('/boards/:id', (req, res) => {
  db.prepare('DELETE FROM boards WHERE id = ?').run(req.params.id);
  res.send('Deleted');
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});