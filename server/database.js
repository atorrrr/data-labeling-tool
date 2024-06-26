const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Database connected');
    db.run(`CREATE TABLE IF NOT EXISTS datasets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      labelOptions TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT,
      label TEXT,
      dataset_id INTEGER,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (dataset_id) REFERENCES datasets (id)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS llm_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      description TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS llm_inputs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      input TEXT,
      original_output TEXT,
      curated_output TEXT,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (session_id) REFERENCES llm_sessions (id)
    )`);
  }
});

module.exports = db;