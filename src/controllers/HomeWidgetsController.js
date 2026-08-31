import { ST } from '../state.js';
import { escapeHtml } from '../utils/sanitize.js';

export function renderNearestGoal() {
  const el = document.getElementById('nearestGoal');
  if (!el) return;
  const goals = (ST.learningGoals || []).filter(g => g.status === 'active');
  if (!goals.length) { el.innerHTML = ''; el.style.display = 'none'; return; }
  const dated = goals.filter(g => g.targetDate).sort((a, b) => a.targetDate.localeCompare(b.targetDate));
  const g = dated[0] || goals[0];
  el.style.display = 'block';
  const days = g.targetDate ? Math.ceil((new Date(g.targetDate + 'T23:59:59') - new Date()) / 86400000) : null;
  const due = days == null ? '' : days < 0 ? 'срок прошёл' : days === 0 ? 'сегодня' : `ещё ${days} дн.`;
  el.innerHTML = `
    <div class="section-title">Ближайшая цель</div>
    <div style="font-size:14px;font-weight:600">${escapeHtml(g.title)}</div>
    <div style="font-size:12px;color:var(--muted);margin-top:4px">
      ${g.targetHours ? g.targetHours + ' ч · ' : ''}${g.targetDate ? escapeHtml(g.targetDate) : 'без срока'}${due ? ' · ' + due : ''}
    </div>
  `;
}
