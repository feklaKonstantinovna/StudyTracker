const fs   = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'db.json');

const EMPTY_DB = () => ({
  users:          [],
  authTokens:     [],
  refreshTokens:  [],
  userData:       {},
  telegramLinks:  {},
  telegramCodes:  {},
});

class Database {
  read() {
    if (!fs.existsSync(DB_FILE)) return EMPTY_DB();
    try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
    catch  { return EMPTY_DB(); }
  }

  write(db) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  }
}

module.exports = new Database();
