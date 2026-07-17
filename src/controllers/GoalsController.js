import { ST, persist, newGoalId } from '../state.js';
import { escapeHtml } from '../utils/sanitize.js';
import { showToast } from '../utils/toast.js';
import { api } from '../services/ApiService.js';

let _renderAnalytics;
export function initGoals(renderAnalyticsFn) { _renderAnalytics = renderAnalyticsFn; }

// ── Goals list modal ──────────────────────────────────────────────────────────

export function openGoalsModal() {
  renderGoalsModal();
  document.getElementById('goalsModal').classList.add('show');
}

function renderGoalsModal() {
  const list = document.getElementById('goalsList');
  const goals = ST.learningGoals || [];
  list.innerHTML = goals.length === 0
    ? '<div style="color:var(--muted);font-size:12px;text-align:center;padding:8px">Целей нет. Добавь первую цель!</div>'
    : goals.map(g => {
        const topic = g.topicId ? ST.topics.find(t => t.id === g.topicId) : null;
        const statusBadge = g.status === 'done' ? 'badge-green' : g.status === 'paused' ? 'badge-yellow' : 'badge-ac';
        const statusText  = g.status === 'done' ? '✅ Выполнена' : g.status === 'paused' ? '⏸ Пауза' : '🎯 Активна';
        return `<div class="tpl-item" data-testid="goal-item-${g.id}" style="flex-direction:column;align-items:stretch;">
          <div style="display:flex;align-items:center;gap:8px;">
            ${topic ? `<div style="width:28px;height:28px;border-radius:6px;background:${escapeHtml(topic.color)}22;display:flex;align-items:center;justify-content:center;font-size:14px">${escapeHtml(topic.icon)}</div>` : '<div style="width:28px"></div>'}
            <div style="flex:1">
              <div style="font-size:13px;font-weight:600" data-testid="goal-title-${g.id}">${escapeHtml(g.title)}</div>
              <div style="font-size:10px;color:var(--muted)">
                ${g.targetHours ? `${g.targetHours}ч` : ''}
                ${g.targetDate ? ` · до ${escapeHtml(g.targetDate)}` : ''}
                ${topic ? ` · ${escapeHtml(topic.name)}` : ''}
              </div>
            </div>
            <span class="badge ${statusBadge}">${statusText}</span>
            <button class="icon-btn" onclick="window._openEditGoalModal('${escapeHtml(g.id)}')" data-testid="btn-edit-goal-${g.id}">✏️</button>
            <button class="icon-btn" onclick="window._deleteGoal('${escapeHtml(g.id)}')" data-testid="btn-delete-goal-${g.id}">🗑</button>
          </div>
        </div>`;
      }).join('');
}

// ── Add / Edit single goal ────────────────────────────────────────────────────

let glId = null, glNew = false;

export function openAddGoalModal() {
  glId = newGoalId(); glNew = true;
  _fillGoalForm({ title: '', topicId: '', targetHours: '', targetDate: '', status: 'active' });
  document.getElementById('glModalTitle').textContent = 'Новая цель';
  document.getElementById('goalEditModal').classList.add('show');
}

export function openEditGoalModal(id) {
  const g = (ST.learningGoals || []).find(x => x.id === id); if (!g) return;
  glId = id; glNew = false;
  _fillGoalForm(g);
  document.getElementById('glModalTitle').textContent = 'Редактировать цель';
  document.getElementById('goalEditModal').classList.add('show');
}

function _fillGoalForm(g) {
  document.getElementById('glTitle').value       = g.title || '';
  document.getElementById('glTargetHours').value = g.targetHours || '';
  document.getElementById('glTargetDate').value  = g.targetDate  || '';
  document.getElementById('glStatus').value      = g.status      || 'active';
  // Fill topic select
  const sel = document.getElementById('glTopicId');
  sel.innerHTML = '<option value="">— без темы —</option>' +
    (ST.topics || []).map(t => `<option value="${t.id}"${t.id === g.topicId ? ' selected' : ''}>${escapeHtml(t.icon)} ${escapeHtml(t.name)}</option>`).join('');
}

export function saveGoalModal() {
  const title = document.getElementById('glTitle').value.trim();
  if (!title) { showToast('Введи название цели'); return; }
  const goal = {
    id:          glId,
    title,
    topicId:     document.getElementById('glTopicId').value || null,
    targetHours: parseFloat(document.getElementById('glTargetHours').value) || 0,
    targetDate:  document.getElementById('glTargetDate').value  || null,
    status:      document.getElementById('glStatus').value      || 'active',
  };
  if (!ST.learningGoals) ST.learningGoals = [];
  if (glNew) ST.learningGoals.push(goal);
  else {
    const i = ST.learningGoals.findIndex(g => g.id === glId);
    if (i >= 0) ST.learningGoals[i] = goal;
  }
  persist(); api.syncGoals(ST.learningGoals);
  document.getElementById('goalEditModal').classList.remove('show');
  renderGoalsModal();
  showToast(glNew ? '🎯 Цель добавлена' : '🎯 Цель обновлена');
}

export function deleteGoal(id) {
  if (!confirm('Удалить цель?')) return;
  ST.learningGoals = (ST.learningGoals || []).filter(g => g.id !== id);
  persist(); api.syncGoals(ST.learningGoals);
  renderGoalsModal();
  showToast('Цель удалена');
}

// ── Goals summary card for analytics (used by AnalyticsController) ───────────
export function renderGoalsSummary(topicTimeMap) {
  const goals = (ST.learningGoals || []).filter(g => g.status === 'active' && g.targetHours > 0);
  if (!goals.length) return `<div class="card" style="margin-bottom:10px">
    <div class="section-title">🎯 Цели</div>
    <div style="font-size:12px;color:var(--muted);text-align:center;padding:8px">
      Целей нет. <button class="btn btn-ghost btn-sm" onclick="window._openGoalsModal()">Задать цели</button>
    </div></div>`;

  const cards = goals.map(g => {
    const topic  = g.topicId ? ST.topics.find(t => t.id === g.topicId) : null;
    const doneMin = topicTimeMap[g.topicId] || 0;
    const doneH   = Math.round(doneMin / 60 * 10) / 10;
    const pct     = g.targetHours ? Math.min(Math.round(doneH / g.targetHours * 100), 100) : 0;
    const color   = topic ? topic.color : 'var(--ac)';
    const label   = topic ? `${topic.icon} ${topic.name}` : escapeHtml(g.title);
    return `<div class="goal-card">
      <div class="goal-label">${label}</div>
      <div class="goal-row">
        <span class="goal-val">${doneH}ч</span>
        <span class="goal-target">/ ${g.targetHours}ч</span>
      </div>
      <div class="goal-bar"><div class="goal-fill" style="width:${pct}%;background:${color}"></div></div>
      <div style="font-size:10px;color:var(--muted);margin-top:3px">${pct}%${g.targetDate ? ' · до ' + escapeHtml(g.targetDate) : ''}</div>
    </div>`;
  }).join('');

  return `<div class="card" style="margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div class="section-title" style="margin:0">🎯 Цели</div>
      <button class="btn btn-ghost btn-sm" onclick="window._openGoalsModal()">Управление</button>
    </div>
    <div class="goals-grid">${cards}</div></div>`;
}
