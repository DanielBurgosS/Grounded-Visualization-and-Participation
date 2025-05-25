const express = require('express');
const cors = require('cors');
const db = require('./db');
const path = require('path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

db.initDB();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Prototype.html'));
});

app.use(cors());
app.use(express.json());

// Session middleware must come before passport
app.use(session({
  secret: 'your_secret_session_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, sameSite: 'lax' } // Set to true for secure in production
}));

app.use(passport.initialize());
app.use(passport.session());
//LOG USER
app.use((req, res, next) => {
  console.log('Current user:', req.user);
  next();
});

passport.use(new GoogleStrategy({
  clientID: '777120888972-0icvlb4k7nooof55rkk3i2miqnvraiao.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: 'https://smatiiihost.ddns.net/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  db.getUserByGoogleId(profile.id, (err, user) => {
    if (err) return done(err);
    if (user) {
      return done(null, user);
    } else {
      db.createUserWithGoogleId(profile.id, (err, newUser) => {
        if (err) return done(err);
        return done(null, newUser);
      });
    }
  });
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  db.getUserById(id, (err, user) => {
    if (err) return done(err);
    done(null, user);
  });
});

app.use((req, res, next) => {
  console.log('Received request:', req.method, req.url);
  next();
});

// Get all threads with comments
app.get('/api/threads', (req, res) => {
  db.getAllThreads((err, threads) => {
    //if (err) return res.status(500).json({ error: 'Database error' });
    res.json(threads);
  });
});

// Add a new thread
app.post('/api/threads', (req, res) => {
  const { lat, lng } = req.body;
  //console.log('Creating thread hi '); // Debug log
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }
  db.addThread(lat, lng, (err, thread) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(thread);
  });
});

// Add a comment to a thread
app.post('/api/comments', (req, res) => {
  const { thread_id, user, text, timestamp } = req.body;
  if (!thread_id || !user || !text || !timestamp) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  db.addComment(thread_id, user, text, timestamp, (err, comment) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(comment);
  });
});

// Like or dislike a comment
app.post('/api/reaction', (req, res) => {
  const { comment_id, type } = req.body;
  if (!comment_id || !['likes', 'dislikes'].includes(type)) {
    return res.status(400).json({ error: 'Invalid reaction' });
  }
  db.updateReaction(comment_id, type, (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ success: true });
  });
});

// Delete a thread and its comments
app.delete('/api/threads/:id', (req, res) => {
  const threadId = parseInt(req.params.id, 10);
  console.log('Deleting thread', threadId); // Debug log
  if (!threadId) return res.status(400).json({ error: 'Invalid thread id' });
  db.deleteThread(threadId, (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ success: true });
  });
});

// Start Google OAuth login
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication, redirect to your app
    res.redirect('/');
  }
);

// Add a whoami endpoint to return the current user
app.get('/api/whoami', (req, res) => {
  res.json({ user: req.user || null });
});

app.post('/api/set-username', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  const { username, role } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  if (!role) return res.status(400).json({ error: 'Role required' });
  db.setUsernameForUser(req.user.id, username, role, (err) => {
    if (err) {
      if (err.message && err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      return res.status(500).json({ error: 'Database error' });
    }
    // Update user in session and req.user
    req.user.username = username;
    req.user.role = role;
    req.session.passport.user = req.user.id;
    res.json({ success: true, username, role });
  });
});

app.post('/api/logout', (req, res) => {
  if (req.logout) {
    req.logout(function(err) {
      // Ignore error for now, but you could handle it if needed
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({ success: true });
      });
    });
  } else {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const API_BASE = '/api'; 
