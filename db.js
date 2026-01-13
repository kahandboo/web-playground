const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

let db;

async function initDB() {
  db = await open({
    filename: './db/database.db',
    driver: sqlite3.Database
  });

  await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            passwordHash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS posts (
            idx INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            userId TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
  console.log('SQLite DB 연결 완료');
}

function getDB() {
  return db;
}

module.exports = { initDB, getDB };