const db = require('./db');

const [,, command, arg] = process.argv;

if (command === 'delete-thread') {
  db.deleteThread(Number(arg), (err) => {
    if (err) {
      console.error('Error deleting thread:', err);
    } else {
      console.log('Thread deleted:', arg);
    }
    process.exit();
  });
} else if (command === 'delete-user') {
  db.deleteThreadsByUser(arg, (err) => {
    if (err) {
      console.error('Error deleting threads by user:', err);
      process.exit();
    }
    db.deleteUserByUsername(arg, (err) => {
      if (err) {
        console.error('Error deleting user:', err);
      } else {
        console.log('User and their threads deleted:', arg);
      }
      process.exit();
    });
  });
} else if (command === 'delete-threads-by-user') {
  db.deleteThreadsByUser(arg, (err, count) => {
    if (err) {
      console.error('Error deleting threads by user:', err);
    } else {
      console.log('Threads deleted for user', arg + ':', count);
    }
    process.exit();
  });
} else {
  console.log('Usage: node admin.js delete-thread <id> | delete-user <username> | delete-threads-by-user <username>');
  process.exit();
} 