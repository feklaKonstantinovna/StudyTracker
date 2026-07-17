import { getSched, getDayD, persist, newTaskId } from '../state.js';
import { dk } from '../utils/dateUtils.js';
import { api } from '../services/ApiService.js';

let _getCurDate, _renderSchedule;

export function initTaskModal(getCurDate, renderFn) {
  _getCurDate = getCurDate;
  _renderSchedule = renderFn;
}

let tmBid = null, tmTid = null, tmNew = false;

export function openTaskModal(bid, tid) {
  const sc = getSched(_getCurDate()), b = sc.find(x => x.id === bid), task = b?.tasks.find(t => t.id === tid);
  if (!task) return;
  tmBid = bid; tmTid = tid; tmNew = false;
  const dd = getDayD(_getCurDate());
  document.getElementById('tmText').value    = task.text;
  document.getElementById('tmLink').value    = task.link || '';
  document.getElementById('tmComment').value = dd.tc[tid] || task.comment || '';
  document.getElementById('tmAnki').value    = task.anki ? '1' : '0';
  document.getElementById('taskModal').classList.add('show');
}

export function openNewTaskModal(bid) {
  tmBid = bid; tmTid = newTaskId(); tmNew = true;
  document.getElementById('tmText').value    = '';
  document.getElementById('tmLink').value    = '';
  document.getElementById('tmComment').value = '';
  document.getElementById('tmAnki').value    = '0';
  document.getElementById('taskModal').classList.add('show');
}

export function saveTaskModal() {
  const sc = getSched(_getCurDate()), block = sc.find(b => b.id === tmBid);
  if (!block) return;
  const dd = getDayD(_getCurDate()), comment = document.getElementById('tmComment').value;
  if (tmNew) {
    block.tasks.push({
      id: tmTid,
      text: document.getElementById('tmText').value,
      link: document.getElementById('tmLink').value,
      anki: document.getElementById('tmAnki').value === '1',
      comment: '',
    });
    dd.tc[tmTid] = comment;
  } else {
    const task = block.tasks.find(t => t.id === tmTid);
    if (task) {
      task.text = document.getElementById('tmText').value;
      task.link = document.getElementById('tmLink').value;
      task.anki = document.getElementById('tmAnki').value === '1';
    }
    dd.tc[tmTid] = comment;
  }
  persist();
  api.syncSchedule(dk(_getCurDate()), sc);
  api.syncTaskComment(dk(_getCurDate()), tmTid, comment);
  document.getElementById('taskModal').classList.remove('show');
  _renderSchedule();
  setTimeout(() => document.getElementById('sblock-' + tmBid)?.classList.add('open'), 0);
}
