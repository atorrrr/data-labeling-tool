const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Database connected');
    
    // Create datasets table
    db.run(`CREATE TABLE IF NOT EXISTS datasets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      labelOptions TEXT
    )`, (err) => {
      if (err) {
        console.error('Error creating datasets table', err);
      } else {
        console.log('Datasets table created or already exists');
      }
    });

    // Create items table
    db.run(`CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT,
      label TEXT,
      dataset_id INTEGER,
      FOREIGN KEY (dataset_id) REFERENCES datasets (id)
    )`, (err) => {
      if (err) {
        console.error('Error creating items table', err);
      } else {
        console.log('Items table created or already exists');
      }
    });

    console.log('Database initialization complete');
  }
});

// Close the database connection
db.close((err) => {
  if (err) {
    console.error('Error closing database', err);
  } else {
    console.log('Database connection closed');
  }
});
