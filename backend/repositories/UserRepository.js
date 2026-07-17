const db = require('./Database');

class UserRepository {
  findByEmail(email) {
    return db.read().users.find(u => u.email === email) || null;
  }

  findById(id) {
    return db.read().users.find(u => u.id === id) || null;
  }

  create(email) {
    const user = {
      id:        Date.now().toString(),
      email:     email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
    };
    const state = db.read();
    state.users.push(user);
    db.write(state);
    return user;
  }

  findOrCreate(email) {
    const normalized = email.trim().toLowerCase();
    return this.findByEmail(normalized) || this.create(normalized);
  }
}

module.exports = new UserRepository();
