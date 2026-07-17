import { ST } from '../state.js';
import { dk, DAYS, MONTHS_R, MONTHS_S } from '../utils/dateUtils.js';
import { showToast } from '../utils/toast.js';
import { renderGoalsSummary } from './GoalsController.js';

export function renderAnalytics() {
  const days  = parseInt(document.getElementById('anPeriod')?.value) || 7;
  const dates = [];
  for (let i = days - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); dates.push(d); }

  let tBlocks = 0, dBlocks = 0, tTasks = 0, dTasks = 0, studyDays = 0, curStr = 0, maxStr = 0;

  // Build topic time map keyed by topicId (or '__other__' for untagged)
  const topicTimeMap = {};
  const wData = [];

  dates.forEach(d => {
    const k = dk(d), sc = ST.schedules[k], dd = ST.dayData[k];
    if (!sc) { wData.push({ d, pct: 0, done: 0, total: 0 }); return; }
    const main  = sc.filter(b => !b.isBreak), done = main.filter(b => dd && dd.bd[b.id]).length;
    const tasks = sc.flatMap(b => b.tasks || []), dtasks = tasks.filter(t => dd && dd.td[t.id]).length;
    tBlocks += main.length; dBlocks += done; tTasks += tasks.length; dTasks += dtasks;
    const pct = main.length ? Math.round(done / main.length * 100) : 0;
    if (pct > 0) { studyDays++; curStr++; } else curStr = 0;
    maxStr = Math.max(maxStr, curStr);
    wData.push({ d, pct, done, total: main.length });
    // accumulate topic time
    main.forEach(b => {
      if (!dd || !dd.bd[b.id]) return;
      const key = b.topicId || '__other__';
      topicTimeMap[key] = (topicTimeMap[key] || 0) + b.dur;
    });
  });

  const pct = tBlocks ? Math.round(dBlocks / tBlocks * 100) : 0;
  const avg = studyDays ? Math.round(dBlocks / studyDays * 10) / 10 : 0;

  // Build topic bars — user-defined topics first, then __other__
  const topicBars = _buildTopicBars(topicTimeMap);

  const rows = wData.map(({ d, pct, done, total }) =>
    `<tr><td>${d.getDate()} ${MONTHS_S[d.getMonth()]}</td><td>${DAYS[d.getDay()].slice(0,2)}</td><td>${done}/${total}</td><td><span class="badge ${pct >= 80 ? 'badge-green' : pct >= 40 ? 'badge-yellow' : 'badge-red'}">${pct}%</span></td></tr>`
  ).join('');

  const streakDots = dates.map(d => {
    const k = dk(d), dd = ST.dayData[k], sc = ST.schedules[k];
    if (!sc || !dd) return `<div class="streak-day" style="background:var(--s3);color:var(--muted)">${d.getDate()}</div>`;
    const m = sc.filter(b => !b.isBreak), dn = m.filter(b => dd.bd[b.id]).length, p = m.length ? dn / m.length : 0;
    const col = p >= .8 ? 'var(--green)' : p > 0 ? 'var(--yellow)' : 'var(--s3)';
    return `<div class="streak-day" style="background:${col};color:${p > 0 ? '#000' : 'var(--muted)'}">${d.getDate()}</div>`;
  }).join('');

  document.getElementById('analyticsContent').innerHTML =
    renderGoalsSummary(topicTimeMap) + `
    <div class="analytics-grid" data-testid="analytics-big-stats">
      <div class="big-stat"><div class="big-stat-val">${pct}%</div><div class="big-stat-lbl">Прогресс за ${days} дней</div></div>
      <div class="big-stat"><div class="big-stat-val">${studyDays}</div><div class="big-stat-lbl">Дней учёбы</div></div>
      <div class="big-stat"><div class="big-stat-val">${curStr}🔥</div><div class="big-stat-lbl">Текущий стрик</div></div>
      <div class="big-stat"><div class="big-stat-val">${avg}</div><div class="big-stat-lbl">Блоков/день</div></div>
    </div>
    <div class="card" style="margin-bottom:10px" data-testid="analytics-topic-chart">
      <div class="section-title">Время по темам</div>${topicBars}
    </div>
    <div class="card" style="margin-bottom:10px" data-testid="analytics-activity">
      <div class="section-title">Активность</div>
      <div class="streak-row">${streakDots}</div>
      <div style="margin-top:6px;display:flex;gap:10px;font-size:10px;color:var(--muted)"><span>🟩 ≥80%</span><span>🟨 >0%</span><span>⬛ пропуск</span></div>
    </div>
    <div class="card" data-testid="analytics-daily-table">
      <div class="section-title">По дням</div>
      <table class="week-table"><thead><tr><th>Дата</th><th>День</th><th>Блоки</th><th>%</th></tr></thead><tbody>${rows}</tbody></table>
    </div>
    <div class="card" style="margin-top:10px" data-testid="analytics-summary">
      <div class="section-title">Итог</div>
      <div style="font-size:12px;color:var(--muted);line-height:1.7">
        За ${days} дней выполнено <b style="color:var(--ac2)">${dBlocks}</b> из <b>${tBlocks}</b> блоков и <b style="color:var(--ac2)">${dTasks}</b> из <b>${tTasks}</b> задач.
        ${maxStr > 1 ? ` Макс. стрик: <b style="color:var(--yellow)">${maxStr} дней</b>.` : ''}
        ${pct >= 80 ? ' 🎉 <b style="color:var(--green)">Отличный результат!</b>' : pct >= 50 ? ' 💪 Хорошее начало.' : ' 📈 Продолжай — прогресс накапливается.'}
      </div>
    </div>`;
}

function _buildTopicBars(topicTimeMap) {
  const entries = [];
  const topics = ST.topics || [];

  // User-defined topics
  topics.forEach(t => {
    const v = topicTimeMap[t.id] || 0;
    entries.push({ label: `${t.icon} ${t.name}`, color: t.color, value: v });
  });
  // Untagged time (blocks without topicId)
  const other = topicTimeMap['__other__'] || 0;
  if (other > 0) entries.push({ label: '📁 Без темы', color: 'var(--muted)', value: other });

  // Fallback: if no topics defined, use old keyword logic for legacy data
  if (topics.length === 0) {
    return _legacyTopicBars(topicTimeMap);
  }

  if (entries.every(e => e.value === 0)) return '<div style="font-size:12px;color:var(--muted);text-align:center;padding:8px">Нет данных за период</div>';

  const maxT = Math.max(...entries.map(e => e.value)) || 1;
  return entries
    .filter(e => e.value > 0)
    .sort((a, b) => b.value - a.value)
    .map(({ label, color, value }) =>
      `<div class="chart-row">
        <div class="chart-lbl" style="width:90px">${label}</div>
        <div class="chart-bg"><div class="chart-fill" style="width:${Math.round(value / maxT * 100)}%;background:${color}"></div></div>
        <div class="chart-val">${value}м</div>
      </div>`
    ).join('');
}

function _legacyTopicBars() {
  // When no user topics exist, rebuild from schedules with keyword matching (legacy support)
  const topicT = { QA: 0, SQL: 0, English: 0, Anki: 0 };
  const days  = parseInt(document.getElementById('anPeriod')?.value) || 7;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = dk(d), sc = ST.schedules[k], dd = ST.dayData[k];
    if (!sc) continue;
    sc.filter(b => !b.isBreak).forEach(b => {
      if (!dd || !dd.bd[b.id]) return;
      const t = b.title.toLowerCase();
      if (t.includes('qa') || t.includes('bible')) topicT.QA += b.dur;
      else if (t.includes('sql'))                   topicT.SQL += b.dur;
      else if (t.includes('english') || t.includes('англ')) topicT.English += b.dur;
      else if (t.includes('anki'))                  topicT.Anki += b.dur;
    });
  }
  const colors = { QA: 'var(--ac)', SQL: 'var(--cyan)', English: 'var(--green)', Anki: 'var(--yellow)' };
  const maxT = Math.max(...Object.values(topicT)) || 1;
  return Object.entries(topicT).map(([n, v]) =>
    `<div class="chart-row">
      <div class="chart-lbl">${n}</div>
      <div class="chart-bg"><div class="chart-fill" style="width:${Math.round(v / maxT * 100)}%;background:${colors[n]}"></div></div>
      <div class="chart-val">${v}м</div>
    </div>`
  ).join('');
}

export function exportCSV() {
  const days = parseInt(document.getElementById('anPeriod')?.value) || 7;
  const dates = [];
  for (let i = days - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); dates.push(d); }
  const DAYS_SHORT = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
  const rows = [['Дата','День','Блоков выполнено','Блоков всего','% выполнения','Задач выполнено','Задач всего']];
  dates.forEach(d => {
    const k = dk(d), sc = ST.schedules[k], dd = ST.dayData[k];
    if (!sc) { rows.push([k, DAYS_SHORT[d.getDay()], 0, 0, 0, 0, 0]); return; }
    const main   = sc.filter(b => !b.isBreak), done = main.filter(b => dd && dd.bd[b.id]).length;
    const tasks  = sc.flatMap(b => b.tasks || []), dtasks = tasks.filter(t => dd && dd.td[t.id]).length;
    const pct    = main.length ? Math.round(done / main.length * 100) : 0;
    rows.push([k, DAYS_SHORT[d.getDay()], done, main.length, pct + '%', dtasks, tasks.length]);
  });
  const csvEscape = v => { const s = String(v); return (s.includes(',') || s.includes('"') || s.includes('\n')) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv  = rows.map(r => r.map(csvEscape).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `studyflow_${dk(new Date())}_${days}days.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('⬇ CSV экспортирован');
}
