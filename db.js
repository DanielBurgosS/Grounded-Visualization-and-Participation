const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbFile = path.join(__dirname, 'threads.db');
const db = new sqlite3.Database(dbFile);

// Initialize tables if they don't exist
function initDB() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lat REAL NOT NULL,
      lng REAL NOT NULL
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      user TEXT NOT NULL,
      text TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      dislikes INTEGER DEFAULT 0,
      FOREIGN KEY(thread_id) REFERENCES threads(id)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_id TEXT UNIQUE,
      username TEXT UNIQUE
    )`);
  });
}

function getAllThreads(callback) {
  db.all('SELECT * FROM threads', (err, threads) => {
    if (err) return callback(err);
    const threadIds = threads.map(t => t.id);
    if (threadIds.length === 0) return callback(null, []);
    db.all('SELECT * FROM comments WHERE thread_id IN (' + threadIds.map(() => '?').join(',') + ')', threadIds, (err, comments) => {
      if (err) return callback(err);
      // Group comments by thread_id
      const commentsByThread = {};
      comments.forEach(c => {
        if (!commentsByThread[c.thread_id]) commentsByThread[c.thread_id] = [];
        commentsByThread[c.thread_id].push(c);
      });
      // Attach comments to threads
      threads.forEach(t => {
        t.comments = commentsByThread[t.id] || [];
      });
      callback(null, threads);
    });
  });
}

function addThread(lat, lng, callback) {
  db.run('INSERT INTO threads (lat, lng) VALUES (?, ?)', [lat, lng], function(err) {
    if (err) return callback(err);
    callback(null, { id: this.lastID, lat, lng, comments: [] });
  });
}

function addComment(thread_id, user, text, timestamp, callback) {
  db.run('INSERT INTO comments (thread_id, user, text, timestamp) VALUES (?, ?, ?, ?)', [thread_id, user, text, timestamp], function(err) {
    if (err) return callback(err);
    callback(null, { id: this.lastID, thread_id, user, text, timestamp, likes: 0, dislikes: 0 });
  });
}

function updateReaction(comment_id, type, callback) {
  const field = type === 'likes' ? 'likes' : 'dislikes';
  db.run(`UPDATE comments SET ${field} = ${field} + 1 WHERE id = ?`, [comment_id], function(err) {
    if (err) return callback(err);
    callback(null);
  });
}

function deleteThread(thread_id, callback) {
  db.serialize(() => {
    db.run('DELETE FROM comments WHERE thread_id = ?', [thread_id], function(err) {
      if (err) return callback(err);
      db.run('DELETE FROM threads WHERE id = ?', [thread_id], function(err2) {
        if (err2) return callback(err2);
        callback(null);
      });
    });
  });
}

// Get user by Google ID
function getUserByGoogleId(google_id, callback) {
  db.get('SELECT * FROM users WHERE google_id = ?', [google_id], (err, user) => {
    if (err) return callback(err);
    callback(null, user);
  });
}

// Create user with Google ID
function createUserWithGoogleId(google_id, callback) {
  db.run('INSERT INTO users (google_id) VALUES (?)', [google_id], function(err) {
    if (err) return callback(err);
    callback(null, { id: this.lastID, google_id });
  });
}

// Set username for user
function setUsernameForUser(user_id, username, callback) {
  db.run('UPDATE users SET username = ? WHERE id = ?', [username, user_id], function(err) {
    if (err) return callback(err);
    callback(null);
  });
}

// Get user by ID
function getUserById(id, callback) {
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
    if (err) return callback(err);
    callback(null, user);
  });
}

module.exports = {
  initDB,
  getAllThreads,
  addThread,
  addComment,
  updateReaction,
  deleteThread,
  getUserByGoogleId,
  createUserWithGoogleId,
  setUsernameForUser,
  getUserById
}; 