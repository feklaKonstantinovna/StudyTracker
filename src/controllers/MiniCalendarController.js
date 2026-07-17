import { ST } from '../state.js';
import { dk, MONTHS_F } from '../utils/dateUtils.js';
import { pauseAll } from './TimerController.js';

let _getCurDate, _setCurDate, _renderSchedule;
let mcY = new Date().getFullYear(), mcM = new Date().getMonth();

export function initMiniCal(getCurDate, setCurDate, renderFn) {
  _getCurDate = getCurDate;
  _setCurDate = setCurDate;
  _renderSchedule = renderFn;
}

export function openMiniCal() {
  const d = _getCurDate();
  mcY = d.getFullYear(); mcM = d.getMonth();
  renderMiniCal();
  document.getElementById('miniCalPopup').classList.add('show');
  document.getElementById('miniCalOverlay').classList.add('show');
}
export function closeMiniCal() {
  document.getElementById('miniCalPopup').classList.remove('show');
  document.getElementById('miniCalOverlay').classList.remove('show');
}
export function mcChangeMonth(d) {
  mcM += d;
  if (mcM < 0)  { mcM = 11; mcY--; }
  if (mcM > 11) { mcM = 0;  mcY++; }
  renderMiniCal();
}

function renderMiniCal() {
  document.getElementById('mcMonthLbl').textContent = `${MONTHS_F[mcM]} ${mcY}`;
  const grid = document.getElementById('mcGrid');
  const dows = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  let h = dows.map(d => `<div class="mc-dow">${d}</div>`).join('');
  let sd = new Date(mcY, mcM, 1).getDay(); if (sd === 0) sd = 7;
  for (let i = 1; i < sd; i++) h += '<div class="mc-day mc-empty"></div>';
  const days = new Date(mcY, mcM + 1, 0).getDate();
  const todayK = dk(new Date()), curK = dk(_getCurDate());
  for (let d = 1; d <= days; d++) {
    const dd = new Date(mcY, mcM, d), k = dk(dd);
    const data = ST.dayData[k], sched = ST.schedules[k];
    let pct = 0, dot = '';
    if (data && sched) {
      const m = sched.filter(b => !b.isBreak), dn = m.filter(b => data.bd[b.id]).length;
      pct = m.length ? Math.round(dn / m.length * 100) : 0;
      dot = pct >= 100 ? 'background:var(--green)' : pct > 0 ? 'background:var(--yellow)' : '';
    }
    const isSel = k === curK, isToday = k === todayK;
    h += `<div class="mc-day${isToday ? ' mc-today' : ''}${isSel ? ' mc-sel' : ''}" onclick="window._mcSelectDay(${mcY},${mcM},${d})" data-testid="mini-cal-day-${k}">
      <span class="mc-dn">${d}</span>
      ${pct > 0 && !isSel ? `<span class="mc-pct" data-testid="mini-cal-day-pct-${k}">${pct}%</span>` : ''}
      ${dot && !isSel ? `<div class="mc-dot" style="${dot}" data-testid="mini-cal-day-dot-${k}"></div>` : ''}
    </div>`;
  }
  grid.innerHTML = h;
}

export function mcSelectDay(y, m, d) {
  pauseAll();
  _setCurDate(new Date(y, m, d));
  closeMiniCal();
  _renderSchedule();
}
