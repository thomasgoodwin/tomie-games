// Shared by backend/index.js (startup safety net) and
// backend/sync-directory.js (invoked directly by scripts/build-karaoke-index.mjs
// so a rescrape updates the database immediately, not just on next restart).

const ADDED_COLUMNS = [
  { name: 'views', type: 'INTEGER' },
  { name: 'channel', type: 'TEXT' },
];

export const ensureDirectoryTable = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS directory_songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist TEXT,
      link TEXT NOT NULL
    )
  `);
  const columns = db.prepare(`PRAGMA table_info(directory_songs)`).all();
  for (const { name, type } of ADDED_COLUMNS) {
    if (!columns.some((c) => c.name === name)) {
      db.exec(`ALTER TABLE directory_songs ADD COLUMN ${name} ${type}`);
    }
  }
  db.exec(`CREATE INDEX IF NOT EXISTS idx_directory_title ON directory_songs(title)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_directory_group ON directory_songs(title, artist)`);
};

export const syncDirectory = (db, songs) => {
  ensureDirectoryTable(db);
  const insert = db.prepare('INSERT INTO directory_songs (title, artist, link, views, channel) VALUES (?, ?, ?, ?, ?)');
  const insertAll = db.transaction((rows) => {
    db.prepare('DELETE FROM directory_songs').run();
    for (const row of rows) {
      insert.run(row.title, row.artist, row.link, row.views ?? null, row.channel ?? null);
    }
  });
  insertAll(songs);
};
