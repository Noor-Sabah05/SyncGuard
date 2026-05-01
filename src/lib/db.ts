import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database;

function getDb() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'syncguard.db');
    db = new Database(dbPath);
    db.exec(`
      CREATE TABLE IF NOT EXISTS decisions (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        founder_id  TEXT NOT NULL,
        category    TEXT NOT NULL,
        content     TEXT NOT NULL,
        summary     TEXT NOT NULL,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS conflicts (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        decision_a_id       INTEGER NOT NULL,
        decision_b_id       INTEGER NOT NULL,
        severity            TEXT NOT NULL,
        conflict_type       TEXT NOT NULL,
        explanation         TEXT NOT NULL,
        suggested_resolution TEXT NOT NULL,
        status              TEXT DEFAULT 'open',
        created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (decision_a_id) REFERENCES decisions(id),
        FOREIGN KEY (decision_b_id) REFERENCES decisions(id)
      );

      CREATE TABLE IF NOT EXISTS users (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        name          TEXT NOT NULL,
        role          TEXT NOT NULL,
        email         TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id         TEXT PRIMARY KEY,
        user_id    INTEGER NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    `);
  }
  return db;
}

export default getDb;
