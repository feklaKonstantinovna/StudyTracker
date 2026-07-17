import { fmtT, pad } from '../utils/dateUtils.js';
import { playBeep } from '../utils/audio.js';
import { showToast } from '../utils/toast.js';
import { getSched } from '../state.js';

export const timers = {};

export function getT(bid) {
  if (!timers[bid]) timers[bid] = { run: false, el: 0, int: null };
  return timers[bid];
}

export function pauseAll() {
  Object.keys(timers).forEach(b => { if (timers[b].run) pauseTimer(b); });
}

export function startTimer(bid, dur) {
  const t = getT(bid);
  if (t.run) return;
  const inp = document.getElementById('dur-' + bid);
  if (inp) dur = parseInt(inp.value) || dur;
  t.run = true; t.dur = dur * 60; t.ts = Date.now() - t.el * 1000;
  t.int = setInterval(() => {
    t.el = Math.floor((Date.now() - t.ts) / 1000);
    updateTUI(bid);
    if (t.el >= t.dur) { pauseTimer(bid); fireNotif(bid); }
  }, 1000);
  updateTUI(bid); updateTBtns(bid);
}

export function pauseTimer(bid) {
  const t = getT(bid);
  if (!t.run) return;
  t.run = false; clearInterval(t.int);
  updateTUI(bid); updateTBtns(bid);
}

export function resetTimer(bid) {
  const t = getT(bid);
  t.run = false; clearInterval(t.int); t.el = 0;
  updateTUI(bid); updateTBtns(bid);
}

function updateTUI(bid) {
  const t = getT(bid), el = document.getElementById('tmr-' + bid);
  if (!el) return;
  el.textContent = fmtT(t.el);
  el.className = 'timer-time' + (t.run ? ' run' : t.el > 0 ? ' pause' : '');
}

function updateTBtns(bid) {
  const t = getT(bid);
  const p = document.getElementById('tplay-' + bid), pa = document.getElementById('tpause-' + bid);
  if (!p) return;
  if (t.run) { p.style.display = 'none'; pa.style.display = 'inline-flex'; }
  else       { p.style.display = 'inline-flex'; pa.style.display = 'none'; }
}

let _getCurDate;
export function initTimer(getCurDate) { _getCurDate = getCurDate; }

function fireNotif(bid) {
  const sc = getSched(_getCurDate()), i = sc.findIndex(b => b.id === bid), cur = sc[i], nx = sc[i + 1];
  let msg = `⏰ "${cur.title}" завершён!`;
  if (nx) msg += nx.isBreak ? ' Время отдохнуть 🌿' : ` Следующий: ${nx.title}`;
  playBeep(); showToast(msg, 4000);
  if (Notification && Notification.permission === 'granted') new Notification('StudyFlow', { body: msg });
}
