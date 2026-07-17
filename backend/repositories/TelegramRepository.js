const db      = require('./Database');
const { isExpired } = require('../utils/dateUtils');

class TelegramRepository {
  // ── Links ──────────────────────────────────────────────────────────────────

  getLink(userId) {
    return db.read().telegramLinks?.[userId] || null;
  }

  setLink(userId, chatId) {
    const state = db.read();
    if (!state.telegramLinks) state.telegramLinks = {};
    state.telegramLinks[userId] = String(chatId);
    db.write(state);
  }

  deleteLink(userId) {
    const state = db.read();
    if (state.telegramLinks) delete state.telegramLinks[userId];
    db.write(state);
  }

  getAllLinks() {
    const links = db.read().telegramLinks || {};
    return Object.entries(links).map(([userId, chatId]) => ({ userId, chatId }));
  }

  findUserIdByChatId(chatId) {
    const links = db.read().telegramLinks || {};
    const entry = Object.entries(links).find(([, cid]) => cid === String(chatId));
    return entry ? entry[0] : null;
  }

  // ── Codes ──────────────────────────────────────────────────────────────────

  saveCode(userId, code, expiresAt) {
    const state = db.read();
    if (!state.telegramCodes) state.telegramCodes = {};
    state.telegramCodes[userId] = { code, expiresAt };
    db.write(state);
  }

  findByCode(code) {
    const codes = db.read().telegramCodes || {};
    const entry = Object.entries(codes).find(([, v]) => v.code === code);
    if (!entry) return null;
    return { userId: entry[0], ...entry[1] };
  }

  deleteCode(userId) {
    const state = db.read();
    if (state.telegramCodes) delete state.telegramCodes[userId];
    db.write(state);
  }
}

module.exports = new TelegramRepository();
