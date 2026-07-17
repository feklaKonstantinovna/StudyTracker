import { ST, persist, newTopicId } from '../state.js';
import { escapeHtml } from '../utils/sanitize.js';
import { showToast } from '../utils/toast.js';
import { api } from '../services/ApiService.js';
import { TOPIC_COLORS } from '../data/defaults.js';

export function renderTopics() {
  const container = document.getElementById('topicsContent');
  if (!container) return;
  const topics = ST.topics || [];

  container.innerHTML = `
    <div style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
      <div class="section-title" style="margin:0">Мои темы</div>
      <button class="btn btn-primary btn-sm" onclick="window._openNewTopicModal()" data-testid="btn-add-topic">＋ Добавить тему</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;" data-testid="topics-list">
      ${topics.length === 0
        ? '<div class="card" style="color:var(--muted);font-size:13px;text-align:center;padding:20px;">Тем нет. Создай первую тему!</div>'
        : topics.map(t => `
          <div class="card" style="display:flex;align-items:center;gap:10px;" data-testid="topic-item-${t.id}">
            <div style="width:36px;height:36px;border-radius:8px;background:${escapeHtml(t.color)}22;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${escapeHtml(t.icon)}</div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:600" data-testid="topic-name-${t.id}">${escapeHtml(t.name)}</div>
              <div style="font-size:10px;color:var(--muted)">Цвет: <span style="color:${escapeHtml(t.color)}">${escapeHtml(t.color)}</span></div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
              <div style="width:10px;height:10px;border-radius:99px;background:${escapeHtml(t.color)}"></div>
              <button class="btn btn-ghost btn-sm" onclick="window._openTopicModal('${escapeHtml(t.id)}')" data-testid="btn-edit-topic-${t.id}">✏️</button>
              <button class="btn btn-danger btn-sm" onclick="window._deleteTopic('${escapeHtml(t.id)}')" data-testid="btn-delete-topic-${t.id}">✕</button>
            </div>
          </div>`).join('')}
    </div>`;
}

let tpId = null, tpNew = false;

export function openNewTopicModal() {
  tpId = newTopicId(); tpNew = true;
  document.getElementById('tpModalTitle').textContent = 'Новая тема';
  document.getElementById('tpName').value  = '';
  document.getElementById('tpIcon').value  = '📚';
  document.getElementById('tpColor').value = TOPIC_COLORS[ST.topics.length % TOPIC_COLORS.length];
  document.getElementById('topicModal').classList.add('show');
}

export function openTopicModal(id) {
  const t = ST.topics.find(x => x.id === id); if (!t) return;
  tpId = id; tpNew = false;
  document.getElementById('tpModalTitle').textContent = 'Редактировать тему';
  document.getElementById('tpName').value  = t.name;
  document.getElementById('tpIcon').value  = t.icon;
  document.getElementById('tpColor').value = t.color;
  document.getElementById('topicModal').classList.add('show');
}

export function saveTopicModal() {
  const name  = document.getElementById('tpName').value.trim();
  const icon  = document.getElementById('tpIcon').value.trim() || '📚';
  const color = document.getElementById('tpColor').value || '#7c6ff7';
  if (!name) { showToast('Введи название темы'); return; }
  if (tpNew) {
    ST.topics.push({ id: tpId, name, icon, color });
  } else {
    const t = ST.topics.find(x => x.id === tpId);
    if (t) { t.name = name; t.icon = icon; t.color = color; }
  }
  persist(); api.syncTopics(ST.topics);
  document.getElementById('topicModal').classList.remove('show');
  renderTopics();
  showToast(tpNew ? '✅ Тема добавлена' : '✅ Тема обновлена');
}

export function deleteTopic(id) {
  if (!confirm('Удалить тему? Блоки с этой темой станут "без темы".')) return;
  ST.topics = ST.topics.filter(t => t.id !== id);
  // clear topicId from blocks that referenced this topic
  Object.values(ST.schedules).forEach(sc => {
    sc.forEach(b => { if (b.topicId === id) b.topicId = null; });
  });
  persist(); api.syncTopics(ST.topics);
  renderTopics();
  showToast('Тема удалена');
}
