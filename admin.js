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
  db.deleteUserByUsername(arg, (err) => {
    if (err) {
      console.error('Error deleting user:', err);
    } else {
      console.log('User deleted:', arg);
    }
    process.exit();
  });
} else {
  console.log('Usage: node admin.js delete-thread <id> | delete-user <username>');
  process.exit();
} 