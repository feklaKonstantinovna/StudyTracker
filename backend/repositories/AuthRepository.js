const db      = require('./Database');
const { isExpired } = require('../utils/dateUtils');

class AuthRepository {
  // ── Magic-link tokens ──────────────────────────────────────────────────────

  saveAuthToken(token, userId, expiresAt) {
    const state = db.read();
    state.authTokens = (state.authTokens || []).filter(t => !isExpired(t.expiresAt));
    state.authTokens.push({ token, userId, expiresAt, used: false });
    db.write(state);
  }

  findAuthToken(token) {
    const state = db.read();
    return (state.authTokens || []).find(t => t.token === token && !t.used) || null;
  }

  markAuthTokenUsed(token) {
    const state = db.read();
    const row = (state.authTokens || []).find(t => t.token === token);
    if (row) { row.used = true; db.write(state); }
  }

  // ── Refresh tokens ─────────────────────────────────────────────────────────

  saveRefreshToken(token, userId, expiresAt) {
    const state = db.read();
    state.refreshTokens = (state.refreshTokens || []).filter(t => !isExpired(t.expiresAt));
    state.refreshTokens.push({ token, userId, expiresAt });
    db.write(state);
  }

  findRefreshToken(token) {
    return (db.read().refreshTokens || []).find(t => t.token === token) || null;
  }

  deleteRefreshToken(token) {
    const state = db.read();
    state.refreshTokens = (state.refreshTokens || []).filter(t => t.token !== token);
    db.write(state);
  }
}

module.exports = new AuthRepository();
