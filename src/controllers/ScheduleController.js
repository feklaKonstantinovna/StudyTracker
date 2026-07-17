import { ST, getSched, getDayD, persist, newBlockId, newTaskId } from '../state.js';
import { dk, isWE, DAYS, MONTHS_R, pad, stopProp, fmtT } from '../utils/dateUtils.js';
import { escapeHtml } from '../utils/sanitize.js';
import { showToast } from '../utils/toast.js';
import { timers, getT, startTimer, pauseTimer, resetTimer, pauseAll } from './TimerController.js';
import { api } from '../services/ApiService.js';

let _getCurDate, _setCurDate, _renderSchedule;

export function initSchedule(getCurDate, setCurDate, renderFn) {
  _getCurDate = getCurDate;
  _setCurDate = setCurDate;
  _renderSchedule = renderFn;
}

export function changeDay(d) {
  pauseAll();
  const cur = new Date(_getCurDate());
  cur.setDate(cur.getDate() + d);
  _setCurDate(cur);
  _renderSchedule();
}

export function renderSchedule() {
  const d = _getCurDate(), k = dk(d), sc = getSched(d), dd = getDayD(d);
  document.getElementById('sDayName').textContent = (isWE(d) ? '🌿 ' : '') + DAYS[d.getDay()];
  document.getElementById('sDateFull').textContent = `${d.getDate()} ${MONTHS_R[d.getMonth()]} ${d.getFullYear()}`;
  document.getElementById('weekendCard').classList.toggle('show', isWE(d));

  const main = sc.filter(b => !b.isBreak);
  const done = main.filter(b => dd.bd[b.id]).length;
  const pct  = main.length ? Math.round(done / main.length * 100) : 0;
  document.getElementById('sPct').textContent = pct + '%';
  document.getElementById('sFill').style.width = pct + '%';

  let ts = 0; Object.values(timers).forEach(t => ts += t.el || 0);
  const h = Math.floor(ts / 3600), m = Math.floor((ts % 3600) / 60);
  const ankAll = sc.flatMap(b => b.tasks || []).filter(t => t.anki);
  const ankDone = ankAll.filter(t => dd.td[t.id]);
  document.getElementById('statsRow').innerHTML = `
    <div class="stat-card"><span class="stat-val">${done}/${main.length}</span><span class="stat-lbl">блоков</span></div>
    <div class="stat-card"><span class="stat-val">${h > 0 ? h + 'ч' : m + 'м'}</span><span class="stat-lbl">потрачено</span></div>
    <div class="stat-card"><span class="stat-val">${ankDone.length}/${ankAll.length}</span><span class="stat-lbl">Anki задач</span></div>`;

  const container = document.getElementById('schedBlocks');
  container.innerHTML = '';

  sc.forEach(block => {
    const isDone = dd.bd[block.id] || false;
    const t = getT(block.id);
    const clrMap = {
      'ic-qa':'rgba(124,111,247,.15)', 'ic-sql':'rgba(34,211,238,.12)',
      'ic-eng':'rgba(74,222,128,.12)', 'ic-anki':'rgba(251,191,36,.12)', 'ic-break':'rgba(107,107,138,.12)'
    };

    // If block has topicId, use topic color; fallback to cls
    let bg = clrMap[block.cls] || 'rgba(124,111,247,.12)';
    if (block.topicId) {
      const topic = ST.topics.find(tp => tp.id === block.topicId);
      if (topic) bg = topic.color + '22';
    }

    let endT = '';
    try {
      const [hh, mm] = block.time.split(':').map(Number);
      const d2 = new Date(0, 0, 0, hh, mm + block.dur);
      endT = `${pad(d2.getHours())}:${pad(d2.getMinutes())}`;
    } catch {}

    const tasksHTML = (block.tasks || []).map(task => {
      const tdone = dd.td[task.id] || false;
      const tcom  = dd.tc[task.id] || task.comment || '';
      return `<div class="task-row" id="trow-${task.id}" data-testid="task-row-${task.id}">
        <div class="task-cb-s${tdone ? ' chk' : ''}" onclick="window._toggleTask('${escapeHtml(block.id)}','${escapeHtml(task.id)}')" data-testid="task-checkbox-${task.id}"></div>
        <div style="flex:1">
          <div class="task-label${tdone ? ' done' : ''}">${escapeHtml(task.text)}${task.link ? `<a href="${escapeHtml(task.link)}" target="_blank" onclick="event.stopPropagation()" rel="noopener noreferrer" style="color:var(--ac2);font-size:10px;margin-left:5px">↗</a>` : ''}${task.anki ? '<span class="anki-pill">Anki</span>' : ''}</div>
          ${tcom ? `<div class="task-comment">${escapeHtml(tcom)}</div>` : ''}
        </div>
        <div class="task-actions">
          <button class="icon-btn" onclick="event.stopPropagation();window._openTaskModal('${escapeHtml(block.id)}','${escapeHtml(task.id)}')" data-testid="btn-edit-task-${task.id}">✏️</button>
          <button class="icon-btn" onclick="event.stopPropagation();window._deleteTask('${escapeHtml(block.id)}','${escapeHtml(task.id)}')" data-testid="btn-delete-task-${task.id}">🗑</button>
        </div>
      </div>`;
    }).join('');

    const bcom = dd.bc[block.id] || '';
    const div = document.createElement('div');
    div.className = 'sblock' + (isDone ? ' done-block' : '');
    div.id = 'sblock-' + block.id;
    div.draggable = true;
    div.ondragstart  = e => blockDragStart(block.id, e);
    div.ondragend    = () => blockDragEnd(block.id);
    div.ondragover   = e => blockDragOver(block.id, e);
    div.ondrop       = () => blockDrop(block.id);

    div.innerHTML = `
      <div class="sblock-head" onclick="window._toggleBlock('${escapeHtml(block.id)}')" data-testid="block-head-${block.id}">
        <span class="sblock-drag-handle" draggable="false" onclick="event.stopPropagation()" data-testid="block-drag-handle-${block.id}">⠿</span>
        <span class="sblock-time" data-testid="block-time-${block.id}">${escapeHtml(block.time)}${endT ? ' – ' + endT : ''}</span>
        <div class="sblock-icon" style="background:${bg}" data-testid="block-icon-${block.id}">${escapeHtml(block.icon)}</div>
        <div class="sblock-info">
          <div class="sblock-title" data-testid="block-title-${block.id}">${escapeHtml(block.title)}</div>
          ${block.sub ? `<div class="sblock-sub" data-testid="block-subtitle-${block.id}">${escapeHtml(block.sub)}</div>` : ''}
        </div>
        <div class="sblock-cb${isDone ? ' chk' : ''}" onclick="event.stopPropagation();window._toggleBlockDone('${escapeHtml(block.id)}')" data-testid="block-checkbox-${block.id}"></div>
        <button class="icon-btn" onclick="event.stopPropagation();window._openBlockModal('${escapeHtml(block.id)}')" title="Настройки" data-testid="btn-block-settings-${block.id}">⚙️</button>
        <span class="expand-arrow" data-testid="block-expand-arrow-${block.id}">▼</span>
      </div>
      <div class="sblock-body" data-testid="block-body-${block.id}">
        ${block.isBreak ? '' : `
        <div class="timer-wrap" data-testid="timer-wrap-${block.id}">
          <div class="timer-time${t.run ? ' run' : t.el > 0 ? ' pause' : ''}" id="tmr-${block.id}" data-testid="timer-display-${block.id}">${fmtT(t.el)}</div>
          <div class="dur-edit">Длит.:
            <input type="number" id="dur-${block.id}" value="${block.dur}" min="5" max="300" class="fld" onclick="event.stopPropagation()" onchange="event.stopPropagation();window._updateDur('${escapeHtml(block.id)}',this.value)" data-testid="timer-duration-${block.id}"> мин
          </div>
          <div class="timer-btns">
            <button class="btn btn-sm t-play" id="tplay-${block.id}" style="${t.run ? 'display:none' : ''}" onclick="event.stopPropagation();window._startTimer('${escapeHtml(block.id)}',${block.dur})" data-testid="timer-play-${block.id}">▶ Старт</button>
            <button class="btn btn-sm t-pause" id="tpause-${block.id}" style="${t.run ? '' : 'display:none'}" onclick="event.stopPropagation();window._pauseTimer('${escapeHtml(block.id)}')" data-testid="timer-pause-${block.id}">⏸ Пауза</button>
            <button class="btn btn-sm t-reset" onclick="event.stopPropagation();window._resetTimer('${escapeHtml(block.id)}')" data-testid="timer-reset-${block.id}">■ Сброс</button>
          </div>
          ${block.pomo ? `<div class="pomo-hint" data-testid="block-pomo-${block.id}">🍅 ${escapeHtml(block.pomo)}</div>` : ''}
        </div>`}
        <div class="tasks-head">
          <span class="section-title" style="margin:0">Задачи</span>
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();window._openNewTaskModal('${escapeHtml(block.id)}')" data-testid="btn-add-task-${block.id}">＋ Добавить</button>
        </div>
        <div id="tasks-${block.id}" data-testid="task-list-${block.id}">${tasksHTML}</div>
        <div class="block-comment-area">
          <label>Комментарий к блоку</label>
          <textarea class="fld" placeholder="Заметки..." onclick="event.stopPropagation()" onchange="event.stopPropagation();window._saveBCom('${escapeHtml(block.id)}',this.value)" data-testid="block-comment-${block.id}">${escapeHtml(bcom)}</textarea>
        </div>
      </div>`;
    container.appendChild(div);
  });
}

export function toggleBlock(bid) {
  document.getElementById('sblock-' + bid)?.classList.toggle('open');
}

export function toggleBlockDone(bid) {
  const dd = getDayD(_getCurDate()), sc = getSched(_getCurDate()), block = sc.find(b => b.id === bid);
  const newVal = !dd.bd[bid];
  dd.bd[bid] = newVal;
  const tasksDone = {};
  if (block) {
    block.tasks.forEach(t => {
      dd.td[t.id] = newVal;
      tasksDone[t.id] = newVal;
      const taskEl = document.getElementById('trow-' + t.id);
      if (taskEl) {
        taskEl.querySelector('.task-cb-s')?.classList.toggle('chk', newVal);
        taskEl.querySelector('.task-label')?.classList.toggle('done', newVal);
      }
    });
  }
  persist();
  api.syncBlockDone(dk(_getCurDate()), bid, newVal, tasksDone);
  updateBlockUI(bid);
}

export function toggleTask(bid, tid) {
  const dd = getDayD(_getCurDate()), sc = getSched(_getCurDate()), block = sc.find(b => b.id === bid);
  dd.td[tid] = !dd.td[tid];
  if (!dd.td[tid] && block) dd.bd[bid] = false;
  if (block && block.tasks.every(t => dd.td[t.id])) dd.bd[bid] = true;
  persist();
  api.syncTaskDone(dk(_getCurDate()), tid, dd.td[tid], bid, dd.bd[bid]);
  // targeted DOM update
  const cb = document.querySelector(`[onclick="window._toggleTask('${bid}','${tid}')"]`);
  const label = cb?.nextElementSibling?.querySelector('.task-label');
  if (cb) cb.classList.toggle('chk', dd.td[tid]);
  if (label) label.classList.toggle('done', dd.td[tid]);
  updateBlockUI(bid);
}

function updateBlockUI(bid) {
  const dd = getDayD(_getCurDate()), sc = getSched(_getCurDate());
  const main = sc.filter(b => !b.isBreak);
  const done = main.filter(b => dd.bd[b.id]).length;
  const pct  = main.length ? Math.round(done / main.length * 100) : 0;
  document.getElementById('sPct').textContent  = pct + '%';
  document.getElementById('sFill').style.width = pct + '%';
  const el = document.getElementById('sblock-' + bid);
  if (el) {
    el.querySelector('.sblock-cb')?.classList.toggle('chk', !!dd.bd[bid]);
    el.classList.toggle('done-block', !!dd.bd[bid]);
  }
  const ankAll  = sc.flatMap(b => b.tasks || []).filter(t => t.anki);
  const ankDone = ankAll.filter(t => dd.td[t.id]);
  const sr = document.getElementById('statsRow');
  if (sr) {
    const vals = sr.querySelectorAll('.stat-val');
    if (vals[0]) vals[0].textContent = `${done}/${main.length}`;
    if (vals[2]) vals[2].textContent = `${ankDone.length}/${ankAll.length}`;
  }
}

export function saveBCom(bid, v) {
  const dd = getDayD(_getCurDate());
  dd.bc[bid] = v; persist();
  api.syncBlockComment(dk(_getCurDate()), bid, v);
}

export function updateDur(bid, v) {
  const sc = getSched(_getCurDate()), b = sc.find(x => x.id === bid);
  if (b) { b.dur = parseInt(v) || b.dur; persist(); }
}

export function deleteTask(bid, tid) {
  const sc = getSched(_getCurDate()), b = sc.find(x => x.id === bid);
  if (b) { b.tasks = b.tasks.filter(t => t.id !== tid); persist(); _renderSchedule(); }
  setTimeout(() => document.getElementById('sblock-' + bid)?.classList.add('open'), 0);
}

export function copyScheduleToTomorrow() {
  const tom = new Date(_getCurDate()); tom.setDate(tom.getDate() + 1);
  const tk = dk(tom);
  const copy = JSON.parse(JSON.stringify(getSched(_getCurDate())));
  // generate fresh IDs so dayData won't collide
  copy.forEach(block => {
    block.id = newBlockId();
    block.tasks = (block.tasks || []).map(t => ({ ...t, id: newTaskId() }));
  });
  ST.schedules[tk] = copy;
  persist();
  showToast('📋 Расписание скопировано на завтра');
}

// ── Drag & drop ──────────────────────────────────────────────────────────────
let dragBlockId = null;
function blockDragStart(bid, e) {
  dragBlockId = bid; e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => document.getElementById('sblock-' + bid)?.classList.add('block-dragging'), 0);
}
function blockDragEnd(bid) {
  document.getElementById('sblock-' + bid)?.classList.remove('block-dragging');
  document.querySelectorAll('.sblock').forEach(el => el.classList.remove('block-drag-over'));
  dragBlockId = null;
}
function blockDragOver(bid, e) {
  e.preventDefault();
  if (dragBlockId === bid) return;
  document.querySelectorAll('.sblock').forEach(el => el.classList.remove('block-drag-over'));
  document.getElementById('sblock-' + bid)?.classList.add('block-drag-over');
}
function blockDrop(bid) {
  document.querySelectorAll('.sblock').forEach(el => el.classList.remove('block-drag-over'));
  if (!dragBlockId || dragBlockId === bid) return;
  const sc = getSched(_getCurDate());
  const fromIdx = sc.findIndex(b => b.id === dragBlockId);
  const toIdx   = sc.findIndex(b => b.id === bid);
  if (fromIdx < 0 || toIdx < 0) return;
  const [moved] = sc.splice(fromIdx, 1);
  sc.splice(toIdx, 0, moved);
  persist(); api.syncSchedule(dk(_getCurDate()), sc);
  const openIds = new Set([...document.querySelectorAll('.sblock.open')].map(el => el.id.replace('sblock-', '')));
  _renderSchedule();
  openIds.forEach(id => document.getElementById('sblock-' + id)?.classList.add('open'));
}
