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
      plan:      'free',
      proUntil:  null,
      promoUsed: [],
    };
    const state = db.read();
    state.users.push(user);
    db.write(state);
    return user;
  }

  findOrCreate(email) {
    const normalized = email.trim().toLowerCase();
    const existing = this.findByEmail(normalized);
    if (existing) return this.ensurePlanFields(existing);
    return this.create(normalized);
  }

  ensurePlanFields(user) {
    if (user.plan) return user;
    return this.setPlan(user.id, { plan: 'free', proUntil: null, source: null });
  }

  setPlan(userId, { plan, proUntil, source, promoCode }) {
    const state = db.read();
    const user = state.users.find(u => u.id === userId);
    if (!user) return null;
    user.plan = plan === 'pro' ? 'pro' : 'free';
    user.proUntil = proUntil || null;
    user.source = source || user.source || null;
    if (!user.promoUsed) user.promoUsed = [];
    if (promoCode && !user.promoUsed.includes(promoCode)) user.promoUsed.push(promoCode);
    db.write(state);
    return user;
  }
}

module.exports = new UserRepository();
