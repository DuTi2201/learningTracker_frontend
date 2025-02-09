const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Tạo thư mục data nếu chưa tồn tại
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.resolve(__dirname, '../../data/database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

const initDatabase = () => {
  // Materials table
  db.run(`CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK(type IN ('file', 'link')) NOT NULL,
    link TEXT NOT NULL,
    date TEXT
  )`);

  // Events table
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start TEXT NOT NULL,
    end TEXT NOT NULL,
    instructor TEXT
  )`);

  // Event materials junction table
  db.run(`CREATE TABLE IF NOT EXISTS event_materials (
    event_id TEXT,
    material_id TEXT,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, material_id)
  )`);

  // Goals table
  db.run(`CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    deadline TEXT NOT NULL,
    priority TEXT CHECK(priority IN ('high', 'medium', 'low')) NOT NULL,
    status TEXT CHECK(status IN ('not_started', 'in_progress', 'completed')) NOT NULL
  )`);

  // Assignments table
  db.run(`CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    deadline TEXT NOT NULL,
    status TEXT CHECK(status IN ('not_started', 'in_progress', 'completed')) NOT NULL,
    notes TEXT
  )`);

  // Assignment materials junction table
  db.run(`CREATE TABLE IF NOT EXISTS assignment_materials (
    assignment_id INTEGER,
    material_id TEXT,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
    PRIMARY KEY (assignment_id, material_id)
  )`);

  // Search history table
  db.run(`CREATE TABLE IF NOT EXISTS search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL,
    type TEXT CHECK(type IN ('material', 'event', 'assignment', 'goal')) NOT NULL,
    result_count INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Notifications table
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK(type IN ('info', 'success', 'warning', 'error')) NOT NULL,
    category TEXT CHECK(category IN ('event', 'assignment', 'goal', 'material')) NOT NULL,
    related_id TEXT,
    action_url TEXT,
    is_read INTEGER DEFAULT 0,
    is_sent INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TEXT,
    sent_at TEXT,
    read_at TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TEXT
  )`);
};

module.exports = db; 