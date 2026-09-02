import { dk } from './utils/dateUtils.js';

const KEY = 'sf_events';
const ALLOWED = new Set([
  'recovery_click', 'deadline_set', 'spread_click',
  'pricing_view', 'promo_ok', 'promo_fail',
]);

export function trackEvent(name) {
  if (!ALLOWED.has(name)) return;
  let all = {};
  try { all = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { all = {}; }
  const day = dk(new Date());
  if (!all[day]) all[day] = {};
  all[day][name] = (all[day][name] || 0) + 1;
  localStorage.setItem(KEY, JSON.stringify(all));
}
