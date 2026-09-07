#!/usr/bin/env node
// Loads backend/karaoke-index.json into backend/mydatabase.db. Invoked
// directly by scripts/build-karaoke-index.mjs after a rescrape so the
// database is up to date immediately, not just on the backend's next
// restart.
//
// Usage: node sync-directory.js   (run from the backend/ directory)

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { syncDirectory } from './directorySync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const songs = JSON.parse(readFileSync(path.join(__dirname, 'karaoke-index.json'), 'utf8'));
const db = new Database(path.join(__dirname, 'mydatabase.db'));
syncDirectory(db, songs);
db.close();

console.log(`Synced ${songs.length} songs into backend/mydatabase.db`);
