const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

db.initDB();

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 