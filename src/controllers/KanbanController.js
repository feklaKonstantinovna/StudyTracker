import { ST, getSched, getDayD, persist } from '../state.js';
import { dk, MONTHS_R } from '../utils/dateUtils.js';
import { escapeHtml } from '../utils/sanitize.js';
import { showToast } from '../utils/toast.js';
import { api } from '../services/ApiService.js';

let _getCurDate;
export function initKanban(getCurDate) { _getCurDate = getCurDate; }

export function syncScheduleToKanbanSilent() {
  const k = dk(_getCurDate()), sc = getSched(_getCurDate()), dd = getDayD(_getCurDate());
  const firstCol = ST.kanbanCols[0]?.id;
  if (!firstCol) return;
  sc.forEach(block => {
    if (block.isBreak) return;
    block.tasks.forEach(task => {
      const exists = ST.kanbanCards.find(c => c.sourceTaskId === task.id && c.dateKey === k);
      if (exists) return;
      const isDone = dd.td[task.id];
      const colId  = isDone ? (ST.kanbanCols[ST.kanbanCols.length - 1]?.id || firstCol) : firstCol;
      ST.kanbanCards.push({
        id: 'kc' + Date.now() + Math.random().toString(36).slice(2, 6),
        title: `[${block.title}] ${task.text}`,
        tag: block.cls?.replace('ic-', '').toUpperCase() || '',
        colId, comment: '', sourceTaskId: task.id, dateKey: k,
      });
    });
  });
  persist();
}

export function syncScheduleToKanban() {
  const k = dk(_getCurDate()), sc = getSched(_getCurDate()), dd = getDayD(_getCurDate());
  const firstCol = ST.kanbanCols[0]?.id;
  if (!firstCol) return;
  let added = 0;
  sc.forEach(block => {
    if (block.isBreak) return;
    block.tasks.forEach(task => {
      const exists = ST.kanbanCards.find(c => c.sourceTaskId === task.id && c.dateKey === k);
      if (exists) return;
      const isDone = dd.td[task.id];
      const colId  = isDone ? (ST.kanbanCols[ST.kanbanCols.length - 1]?.id || firstCol) : firstCol;
      ST.kanbanCards.push({
        id: 'kc' + Date.now() + Math.random().toString(36).slice(2, 6),
        title: `[${block.title}] ${task.text}`,
        tag: block.cls?.replace('ic-', '').toUpperCase() || '',
        colId, comment: '', sourceTaskId: task.id, dateKey: k,
      });
      added++;
    });
  });
  persist();
  if (added > 0) { showToast(`🔄 Добавлено ${added} карточек в Канбан`); renderKanban(); }
  else showToast('Все задачи уже синхронизированы');
}

function ensureBacklogCol() {
  if (!ST.kanbanCols.find(c => c.id === 'kc-backlog'))
    ST.kanbanCols.unshift({ id: 'kc-backlog', title: 'Бэклог', color: '#6b6b8a' });
}

function moveOverdueCards() {
  ensureBacklogCol();
  const todayK   = dk(new Date());
  const sevenAgo = new Date(); sevenAgo.setDate(sevenAgo.getDate() - 7);
  const sevenAgoK = dk(sevenAgo);
  const doneColId = ST.kanbanCols.find(c => c.title === 'Готово')?.id || ST.kanbanCols[ST.kanbanCols.length - 1]?.id;
  ST.kanbanCards.forEach(c => {
    if (!c.dateKey || c.dateKey >= todayK) return;
    if (c.colId === doneColId || c.colId === 'kc-backlog') return;
    if (c.dateKey <= sevenAgoK) { c.colId = 'kc-backlog'; c.overdue = true; }
    else { c.overdue = true; c.prevDate = c.prevDate || c.dateKey; c.dateKey = todayK; }
  });
  persist();
}

export function renderKanban() {
  moveOverdueCards();
  const k = dk(_getCurDate());
  document.getElementById('kanbanDateLabel').textContent = `📅 ${_getCurDate().getDate()} ${MONTHS_R[_getCurDate().getMonth()]}`;
  const board = document.getElementById('kanbanBoard');
  board.innerHTML = '';
  const todayCards = ST.kanbanCards.filter(c => c.dateKey === k || !c.dateKey);
  ST.kanbanCols.forEach(col => {
    const cards = col.id === 'kc-backlog'
      ? ST.kanbanCards.filter(c => c.colId === 'kc-backlog')
      : todayCards.filter(c => c.colId === col.id);
    const colEl = document.createElement('div');
    colEl.className = 'kanban-col';
    colEl.setAttribute('data-testid', `kanban-col-${col.id}`);
    colEl.innerHTML = `
      <div class="kanban-col-head" data-testid="kanban-col-head-${col.id}">
        <div class="kanban-col-title">
          <div class="kc-dot" style="background:${escapeHtml(col.color)}"></div>
          <span data-testid="kanban-col-title-${col.id}">${escapeHtml(col.title)}</span>
          <span class="badge badge-ac" data-testid="kanban-col-count-${col.id}">${cards.length}</span>
        </div>
        <button class="icon-btn" onclick="window._delKanbanCol('${escapeHtml(col.id)}')" data-testid="btn-del-col-${col.id}">✕</button>
      </div>
      <div class="kanban-cards" id="kcol-${col.id}" ondragover="event.preventDefault()" ondrop="window._dropKc(event,'${escapeHtml(col.id)}')" data-testid="kanban-cards-${col.id}">
        ${cards.map(c => `
          <div class="kanban-card${c.overdue ? ' kc-overdue' : ''}" draggable="true" id="kcard-${c.id}" ondragstart="window._dragKcStart('${escapeHtml(c.id)}')" ondragend="window._dragKcEnd()" data-testid="kanban-card-${c.id}">
            <div class="kc-title" data-testid="kanban-card-title-${c.id}">${escapeHtml(c.title)}</div>
            <div class="kc-meta">
              ${c.tag ? `<span class="kc-tag" style="background:${escapeHtml(col.color)}22;color:${escapeHtml(col.color)}" data-testid="kanban-card-tag-${c.id}">${escapeHtml(c.tag)}</span>` : ''}
              ${c.overdue ? `<span class="kc-tag" style="background:rgba(248,113,113,.15);color:var(--red)" data-testid="kanban-card-overdue-${c.id}">перенос</span>` : ''}
            </div>
            ${c.comment ? `<div class="kc-comment" data-testid="kanban-card-comment-${c.id}">${escapeHtml(c.comment)}</div>` : ''}
            <div class="kc-card-btns"><button class="icon-btn" onclick="window._openKcModal('${escapeHtml(c.id)}')" data-testid="btn-edit-card-${c.id}">✏️</button></div>
          </div>`).join('')}
      </div>`;
    board.appendChild(colEl);
  });
}

let dragKcId = null;
export function dragKcStart(id) {
  dragKcId = id;
  setTimeout(() => document.getElementById('kcard-' + id)?.classList.add('dragging'), 0);
}
export function dragKcEnd() {
  if (dragKcId) document.getElementById('kcard-' + dragKcId)?.classList.remove('dragging');
  dragKcId = null;
}
export function dropKc(e, colId) {
  if (!dragKcId) return;
  const c = ST.kanbanCards.find(x => x.id === dragKcId);
  if (c) { c.colId = colId; persist(); api.syncKanbanCard(c, false); renderKanban(); }
}
export function delKanbanCol(id) {
  if (!confirm('Удалить колонку?')) return;
  ST.kanbanCols  = ST.kanbanCols.filter(c => c.id !== id);
  ST.kanbanCards = ST.kanbanCards.filter(c => c.colId !== id);
  persist(); api.deleteKanbanCol(id); renderKanban();
}
export function addKanbanCol() {
  const name = prompt('Название колонки:'); if (!name) return;
  const colors = ['#7c6ff7','#22d3ee','#4ade80','#f472b6','#fbbf24','#f87171'];
  const col = { id: 'kc' + Date.now(), title: name, color: colors[ST.kanbanCols.length % colors.length] };
  ST.kanbanCols.push(col); persist(); api.syncKanbanCol(col, true); renderKanban();
}

let kcmId = null, kcmNew = false;
export function openNewKcModal() {
  kcmId = 'kc' + Date.now(); kcmNew = true;
  document.getElementById('kcmTitle').textContent = 'Новая карточка';
  document.getElementById('kcmName').value    = '';
  document.getElementById('kcmTag').value     = '';
  document.getElementById('kcmComment').value = '';
  const sel = document.getElementById('kcmCol');
  sel.innerHTML = ST.kanbanCols.map(c => `<option value="${c.id}">${escapeHtml(c.title)}</option>`).join('');
  document.getElementById('kcmDelete').style.display = 'none';
  document.getElementById('kcModal').classList.add('show');
}
export function openKcModal(id) {
  kcmId = id; kcmNew = false;
  const c = ST.kanbanCards.find(x => x.id === id); if (!c) return;
  document.getElementById('kcmTitle').textContent = 'Карточка';
  document.getElementById('kcmName').value    = c.title;
  document.getElementById('kcmTag').value     = c.tag || '';
  document.getElementById('kcmComment').value = c.comment || '';
  const sel = document.getElementById('kcmCol');
  sel.innerHTML = ST.kanbanCols.map(col => `<option value="${col.id}"${col.id === c.colId ? ' selected' : ''}>${escapeHtml(col.title)}</option>`).join('');
  document.getElementById('kcmDelete').style.display = 'inline-flex';
  document.getElementById('kcModal').classList.add('show');
}
export function initKcDeleteBtn() {
  document.getElementById('kcmDelete').onclick = () => {
    if (!confirm('Удалить карточку?')) return;
    ST.kanbanCards = ST.kanbanCards.filter(c => c.id !== kcmId);
    persist(); api.deleteKanbanCard(kcmId);
    document.getElementById('kcModal').classList.remove('show');
    renderKanban();
  };
}
export function saveKcModal() {
  const title = document.getElementById('kcmName').value.trim();
  if (!title) { showToast('Введите название'); return; }
  const k = dk(_getCurDate());
  let card;
  if (kcmNew) {
    card = { id: kcmId, title, tag: document.getElementById('kcmTag').value, colId: document.getElementById('kcmCol').value, comment: document.getElementById('kcmComment').value, dateKey: k };
    ST.kanbanCards.push(card);
  } else {
    card = ST.kanbanCards.find(x => x.id === kcmId);
    if (card) { card.title = title; card.tag = document.getElementById('kcmTag').value; card.colId = document.getElementById('kcmCol').value; card.comment = document.getElementById('kcmComment').value; }
  }
  persist(); if (card) api.syncKanbanCard(card, kcmNew);
  document.getElementById('kcModal').classList.remove('show');
  renderKanban();
}
