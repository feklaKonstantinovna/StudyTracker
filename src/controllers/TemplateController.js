import { ST, getSched, persist, newBlockId, newTaskId } from '../state.js';
import { dk, MONTHS_R } from '../utils/dateUtils.js';
import { escapeHtml } from '../utils/sanitize.js';
import { showToast } from '../utils/toast.js';
import { apiReq } from '../services/ApiService.js';

let _getCurDate, _renderSchedule;
export function initTemplates(getCurDate, renderFn) {
  _getCurDate = getCurDate;
  _renderSchedule = renderFn;
}

export function openTplModal() {
  renderTplList();
  document.getElementById('tplModal').classList.add('show');
}

function renderTplList() {
  const list = document.getElementById('tplList');
  const tpls = ST.templates || [];
  if (!tpls.length) {
    list.innerHTML = '<div style="font-size:12px;color:var(--muted);text-align:center;padding:12px">Нет сохранённых шаблонов</div>';
    return;
  }
  list.innerHTML = tpls.map(t => `
    <div class="tpl-item" data-testid="template-item-${t.id}">
      <div style="flex:1">
        <div class="tpl-name" data-testid="template-name-${t.id}">${escapeHtml(t.name)}</div>
        <div class="tpl-meta" data-testid="template-meta-${t.id}">${t.blocks.length} блоков · ${new Date(t.createdAt).toLocaleDateString('ru')}</div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="window._applyTemplate('${escapeHtml(t.id)}')" data-testid="btn-apply-template-${t.id}">Применить</button>
      <button class="btn btn-danger btn-sm" onclick="window._deleteTemplate('${escapeHtml(t.id)}')" data-testid="btn-delete-template-${t.id}">✕</button>
    </div>`).join('');
}

export function saveTemplate() {
  const name = document.getElementById('tplName').value.trim();
  if (!name) { showToast('Введи название шаблона'); return; }
  const sc = getSched(_getCurDate());
  if (!ST.templates) ST.templates = [];
  const tpl = { id: 'tpl' + Date.now(), name, blocks: JSON.parse(JSON.stringify(sc)), createdAt: new Date().toISOString() };
  ST.templates.push(tpl);
  persist();
  apiReq('POST', '/api/templates', { name, blocks: tpl.blocks });
  document.getElementById('tplName').value = '';
  showToast('✅ Шаблон «' + name + '» сохранён');
  renderTplList();
}

export function applyTemplate(id) {
  const tpl = (ST.templates || []).find(t => t.id === id); if (!tpl) return;
  const d = _getCurDate(), MONTHS_R_arr = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  if (!confirm(`Применить шаблон «${tpl.name}» к ${d.getDate()} ${MONTHS_R_arr[d.getMonth()]}? Текущее расписание будет заменено.`)) return;
  const k = dk(d);
  ST.schedules[k] = JSON.parse(JSON.stringify(tpl.blocks));
  ST.schedules[k].forEach(b => {
    b.id = newBlockId();
    b.tasks = (b.tasks || []).map(t => ({ ...t, id: newTaskId() }));
  });
  persist();
  apiReq('POST', `/api/schedule/${k}`, { blocks: ST.schedules[k] });
  document.getElementById('tplModal').classList.remove('show');
  _renderSchedule();
  showToast('📋 Шаблон применён');
}

export function deleteTemplate(id) {
  if (!confirm('Удалить шаблон?')) return;
  ST.templates = (ST.templates || []).filter(t => t.id !== id);
  persist();
  apiReq('DELETE', `/api/templates/${id}`);
  renderTplList();
}
