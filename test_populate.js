const db = require('./db');

db.initDB();

const users = [
  { username: 'municipal_user', role: 'Municipality Official', google_id: 'test-google-id-1' },
  { username: 'private_user', role: 'Private company', google_id: 'test-google-id-2' },
  { username: 'neighbour_user', role: 'Friendly neighbour', google_id: 'test-google-id-3' },
];

const centerLat = 52.263;
const centerLng = 6.155;
const offsets = [0, 0.001, -0.001];

function addUserAndThread(user, lat, lng, cb) {
  // Insert user
  db.createUserWithGoogleId(user.google_id, (err, newUser) => {
    if (err) return cb(err);
    db.setUsernameForUser(newUser.id, user.username, user.role, (err2) => {
      if (err2) return cb(err2);
      // Insert thread
      db.addThread(lat, lng, (err3, thread) => {
        if (err3) return cb(err3);
        // Insert comment
        db.addComment(thread.id, user.username, `Test comment by ${user.username}`, new Date().toLocaleString(), (err4) => {
          if (err4) return cb(err4);
          cb(null, { user: user.username, threadId: thread.id });
        });
      });
    });
  });
}

function run() {
  let done = 0;
  users.forEach((user, i) => {
    addUserAndThread(user, centerLat + offsets[i], centerLng + offsets[i], (err, result) => {
      if (err) {
        console.error('Error:', err);
      } else {
        console.log('Created:', result);
      }
      done++;
      if (done === users.length) {
        console.log('Test data population complete.');
        process.exit();
      }
    });
  });
}

run(); 