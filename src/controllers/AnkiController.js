import { ST, getSched, getDayD } from '../state.js';
import { dk } from '../utils/dateUtils.js';
import { escapeHtml } from '../utils/sanitize.js';
import { showToast } from '../utils/toast.js';

let _getCurDate;
export function initAnki(getCurDate) { _getCurDate = getCurDate; }

export function collectAnki(d = _getCurDate()) {
  const items = [];
  const seen = new Set();
  for (let i = 0; i < 14; i++) {
    const day = new Date(d);
    day.setDate(day.getDate() - i);
    const sc = ST.schedules[dk(day)] || [];
    const dd = ST.dayData[dk(day)] || { td: {} };
    sc.forEach(b => (b.tasks || []).forEach(t => {
      if (!t.anki) return;
      if (seen.has(t.text)) return;
      seen.add(t.text);
      items.push({ text: t.text, done: !!dd.td[t.id], date: dk(day) });
    }));
  }
  return items;
}

export function renderAnkiTail() {
  const el = document.getElementById('ankiTail');
  if (!el) return;
  const items = collectAnki();
  if (!items.length) {
    el.innerHTML = '';
    el.style.display = 'none';
    return;
  }
  el.style.display = 'block';
  const open = items.filter(i => !i.done);
  el.innerHTML = `
    <div class="section-title">Anki-хвост</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:8px">Незакрытые карточки за 14 дней: ${open.length}</div>
    ${open.slice(0, 8).map(i => `<div class="task-row"><div class="task-label">${escapeHtml(i.text)}</div></div>`).join('')}
    <button class="btn btn-ghost btn-sm" onclick="window.copyAnkiList()">Скопировать список</button>
  `;
}

export function copyAnkiList() {
  const lines = collectAnki().filter(i => !i.done).map(i => '- ' + i.text).join('\n');
  if (!lines) { showToast('Хвоста нет'); return; }
  navigator.clipboard.writeText(lines).then(() => showToast('Список скопирован')).catch(() => showToast(lines, 5000));
}
