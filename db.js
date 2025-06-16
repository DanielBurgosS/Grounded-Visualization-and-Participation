const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbFile = path.join(__dirname, 'threads.db');
console.log('Database file path:', dbFile);

// Check if directory exists and is writable
const dbDir = path.dirname(dbFile);
if (!fs.existsSync(dbDir)) {
  console.log('Creating database directory:', dbDir);
  fs.mkdirSync(dbDir, { recursive: true });
}

// Check if we can write to the directory
try {
  fs.accessSync(dbDir, fs.constants.W_OK);
  console.log('Directory is writable');
} catch (err) {
  console.error('Cannot write to directory:', err);
}

const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Initialize tables if they don't exist
function initDB() {
  console.log('Initializing database...');
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lat REAL NOT NULL,
      lng REAL NOT NULL
    )`, (err) => {
      if (err) {
        console.error('Error creating threads table:', err);
      } else {
        console.log('Threads table created or already exists');
      }
    });

    db.run(`CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      user TEXT NOT NULL,
      text TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      dislikes INTEGER DEFAULT 0,
      FOREIGN KEY(thread_id) REFERENCES threads(id)
    )`, (err) => {
      if (err) {
        console.error('Error creating comments table:', err);
      } else {
        console.log('Comments table created or already exists');
      }
    });

    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_id TEXT UNIQUE,
      username TEXT UNIQUE,
      role TEXT
    )`, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
      } else {
        console.log('Users table created or already exists');
      }
    });
  });
}

function getAllThreads(callback) {
  db.all('SELECT * FROM threads', (err, threads) => {
    if (err) return callback(err);
    const threadIds = threads.map(t => t.id);
    if (threadIds.length === 0) return callback(null, []);
    db.all('SELECT comments.*, users.role FROM comments LEFT JOIN users ON comments.user = users.username WHERE thread_id IN (' + threadIds.map(() => '?').join(',') + ')', threadIds, (err, comments) => {
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
  db.run('INSERT INTO users (google_id, role) VALUES (?, ?)', [google_id, null], function(err) {
    if (err) return callback(err);
    callback(null, { id: this.lastID, google_id });
  });
}

// Set username for user
function setUsernameForUser(user_id, username, role, callback) {
  db.run('UPDATE users SET username = ?, role = ? WHERE id = ?', [username, role, user_id], function(err) {
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

function deleteUserByUsername(username, callback) {
  db.run('DELETE FROM users WHERE username = ?', [username], function(err) {
    if (err) return callback(err);
    callback(null);
  });
}

function deleteThreadsByUser(username, callback) {
  // Find all thread IDs where this user has posted a comment
  db.all('SELECT DISTINCT thread_id FROM comments WHERE user = ?', [username], (err, rows) => {
    if (err) return callback(err);
    const threadIds = rows.map(r => r.thread_id);
    if (threadIds.length === 0) return callback(null, 0);
    let deleted = 0;
    let errors = [];
    let toDelete = threadIds.length;
    threadIds.forEach(threadId => {
      db.serialize(() => {
        db.run('DELETE FROM comments WHERE thread_id = ?', [threadId], function(err) {
          if (err) errors.push(err);
          db.run('DELETE FROM threads WHERE id = ?', [threadId], function(err2) {
            if (err2) errors.push(err2);
            deleted++;
            if (--toDelete === 0) {
              if (errors.length > 0) return callback(errors);
              callback(null, deleted);
            }
          });
        });
      });
    });
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
  getUserById,
  deleteUserByUsername,
  deleteThreadsByUser
}; 