const db = require('./Database');

const ALLOWED = new Set([
  'view_pricing',
  'promo_activate_ok',
  'promo_activate_fail',
  'sync_blocked_free',
  'telegram_blocked_free',
]);

class FunnelRepository {
  bump(event) {
    if (!ALLOWED.has(event)) return;
    const day = new Date().toISOString().slice(0, 10);
    const state = db.read();
    if (!state.funnel) state.funnel = {};
    if (!state.funnel[day]) state.funnel[day] = {};
    state.funnel[day][event] = (state.funnel[day][event] || 0) + 1;
    db.write(state);
  }
}

module.exports = new FunnelRepository();
