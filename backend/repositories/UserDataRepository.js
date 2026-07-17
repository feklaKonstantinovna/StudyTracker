const db = require('./Database');

const EMPTY_USER_DATA = () => ({
  schedules:   {},
  dayData:     {},
  kanbanCols:  [],
  kanbanCards: [],
  templates:   [],
  goals:       {},
});

class UserDataRepository {
  get(userId) {
    const state = db.read();
    return state.userData[userId]?.data || EMPTY_USER_DATA();
  }

  set(userId, data) {
    const state = db.read();
    state.userData[userId] = { data, updatedAt: new Date().toISOString() };
    db.write(state);
  }

  getMeta(userId) {
    return db.read().userData[userId] || null;
  }
}

module.exports = new UserDataRepository();
