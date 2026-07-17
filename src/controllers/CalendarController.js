import { ST, getSched } from '../state.js';
import { dk, DAYS, MONTHS_R, MONTHS_F, MONTHS_S } from '../utils/dateUtils.js';
import { escapeHtml } from '../utils/sanitize.js';
import { pauseAll } from './TimerController.js';

let calY = new Date().getFullYear(), calM = new Date().getMonth();
let _getCurDate, _setCurDate, _switchTab, _renderSchedule;

export function initCalendar(getCurDate, setCurDate, switchTab, renderFn) {
  _getCurDate    = getCurDate;
  _setCurDate    = setCurDate;
  _switchTab     = switchTab;
  _renderSchedule = renderFn;
}

export function calChange(d) {
  calM += d;
  if (calM < 0)  { calM = 11; calY--; }
  if (calM > 11) { calM = 0;  calY++; }
  renderCal();
}

export function renderCal() {
  document.getElementById('calLbl').textContent = `${MONTHS_F[calM]} ${calY}`;
  const grid = document.getElementById('calGrid');
  const dows = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  let h = dows.map(d => `<div class="cal-dow">${d}</div>`).join('');
  let sd = new Date(calY, calM, 1).getDay(); if (sd === 0) sd = 7;
  for (let i = 1; i < sd; i++) h += '<div class="cal-day empty"></div>';
  const days = new Date(calY, calM + 1, 0).getDate(), todayK = dk(new Date());
  for (let d = 1; d <= days; d++) {
    const dd = new Date(calY, calM, d), k = dk(dd);
    const data = ST.dayData[k], sched = ST.schedules[k];
    let pct = 0, dot = '';
    if (data && sched) {
      const m = sched.filter(b => !b.isBreak), dn = m.filter(b => data.bd[b.id]).length;
      pct = m.length ? Math.round(dn / m.length * 100) : 0;
      dot = pct >= 100 ? 'background:var(--green)' : pct > 0 ? 'background:var(--yellow)' : '';
    }
    h += `<div class="cal-day${k === todayK ? ' today' : ''}" onclick="window._calSelectDay(${calY},${calM},${d})" data-testid="cal-day-${k}">
      <span class="cal-dn">${d}</span>
      ${pct > 0 ? `<span class="cal-pct2" data-testid="cal-day-pct-${k}">${pct}%</span>` : ''}
      ${dot ? `<div class="cal-dot2" style="${dot}" data-testid="cal-day-dot-${k}"></div>` : ''}
    </div>`;
  }
  grid.innerHTML = h;
}

export function calSelectDay(y, m, d) {
  const dd = new Date(y, m, d), k = dk(dd);
  const sched = ST.schedules[k] || getSched(dd);
  const data  = ST.dayData[k];
  const detail = document.getElementById('calDetail');
  detail.style.display = 'block';
  const main  = sched.filter(b => !b.isBreak);
  const done  = main.filter(b => data && data.bd[b.id]).length;
  const tasks = sched.flatMap(b => b.tasks || []);
  const tdone = tasks.filter(t => data && data.td[t.id]).length;
  const pct   = main.length ? Math.round(done / main.length * 100) : 0;
  detail.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;" data-testid="cal-detail-header">
      <div style="font-size:13px;font-weight:600" data-testid="cal-detail-date">${d} ${MONTHS_R[m]} ${y}</div>
      <button class="btn btn-ghost btn-sm" onclick="window._jumpToDay(${y},${m},${d})" data-testid="btn-cal-detail-open">Открыть →</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px" data-testid="cal-detail-stats">
      <div class="stat-card"><span class="stat-val" style="font-size:16px" data-testid="cal-detail-blocks">${done}/${main.length}</span><span class="stat-lbl">блоков</span></div>
      <div class="stat-card"><span class="stat-val" style="font-size:16px" data-testid="cal-detail-tasks">${tdone}/${tasks.length}</span><span class="stat-lbl">задач</span></div>
      <div class="stat-card"><span class="stat-val" style="font-size:16px" data-testid="cal-detail-pct">${pct}%</span><span class="stat-lbl">прогресс</span></div>
    </div>
    ${sched.map(b => {
      const bd = data && data.bd[b.id];
      return `<div style="display:flex;align-items:center;gap:7px;padding:4px 0;border-bottom:1px solid var(--border)" data-testid="cal-detail-block-${b.id}">
        <span data-testid="cal-detail-block-status-${b.id}">${b.isBreak ? '–' : bd ? '✅' : '⬜'}</span>
        <span style="font-size:12px;${b.isBreak ? 'color:var(--muted)' : ''}">${escapeHtml(b.title)}</span>
        <span style="font-size:10px;color:var(--muted);margin-left:auto">${escapeHtml(b.time)}</span>
      </div>`;
    }).join('')}`;
}

export function jumpToDay(y, m, d) {
  pauseAll();
  _setCurDate(new Date(y, m, d));
  _switchTab('schedule');
  _renderSchedule();
}
