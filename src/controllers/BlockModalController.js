import { ST, getSched, persist, newBlockId } from '../state.js';
import { dk } from '../utils/dateUtils.js';
import { api } from '../services/ApiService.js';

let _getCurDate, _renderSchedule;

export function initBlockModal(getCurDate, renderFn) {
  _getCurDate = getCurDate;
  _renderSchedule = renderFn;
}

let bmId = null, bmNew = false;

export function openBlockModal(bid) {
  const sc = getSched(_getCurDate()), b = sc.find(x => x.id === bid);
  if (!b) return;
  bmId = bid; bmNew = false;
  document.getElementById('bmTitle').textContent = 'Редактировать блок';
  document.getElementById('bmName').value  = b.title;
  document.getElementById('bmSub').value   = b.sub || '';
  document.getElementById('bmTime').value  = b.time;
  document.getElementById('bmDur').value   = b.dur;
  document.getElementById('bmIcon').value  = b.icon;
  document.getElementById('bmCls').value   = b.cls || 'ic-qa';
  document.getElementById('bmPomo').value  = b.pomo || '';
  document.getElementById('bmBreak').value = b.isBreak ? '1' : '0';

  // Topic select
  _fillTopicSelect('bmTopicId', b.topicId || '');

  document.getElementById('bmDelete').style.display = 'inline-flex';
  document.getElementById('blockModal').classList.add('show');
}

export function openNewBlockModal() {
  bmId = newBlockId(); bmNew = true;
  document.getElementById('bmTitle').textContent = 'Новый блок';
  document.getElementById('bmName').value  = '';
  document.getElementById('bmSub').value   = '';
  document.getElementById('bmTime').value  = '12:00';
  document.getElementById('bmDur').value   = 60;
  document.getElementById('bmIcon').value  = '📖';
  document.getElementById('bmCls').value   = 'ic-qa';
  document.getElementById('bmPomo').value  = '';
  document.getElementById('bmBreak').value = '0';
  _fillTopicSelect('bmTopicId', '');
  document.getElementById('bmDelete').style.display = 'none';
  document.getElementById('blockModal').classList.add('show');
}

function _fillTopicSelect(selId, selectedTopicId) {
  const sel = document.getElementById(selId);
  if (!sel) return;
  sel.innerHTML = '<option value="">— без темы —</option>' +
    ST.topics.map(t => `<option value="${t.id}"${t.id === selectedTopicId ? ' selected' : ''}>${t.icon} ${t.name}</option>`).join('');
}

export function saveBlockModal() {
  const sc = getSched(_getCurDate());
  const nd = {
    id:      bmId,
    title:   document.getElementById('bmName').value,
    sub:     document.getElementById('bmSub').value,
    time:    document.getElementById('bmTime').value,
    dur:     parseInt(document.getElementById('bmDur').value) || 60,
    icon:    document.getElementById('bmIcon').value || '📖',
    cls:     document.getElementById('bmCls').value,
    topicId: document.getElementById('bmTopicId')?.value || null,
    pomo:    document.getElementById('bmPomo').value,
    isBreak: document.getElementById('bmBreak').value === '1',
    tasks:   bmNew ? [] : (sc.find(b => b.id === bmId) || {}).tasks || [],
  };
  if (!nd.topicId) nd.topicId = null;
  if (bmNew) sc.push(nd);
  else {
    const i = sc.findIndex(b => b.id === bmId);
    if (i >= 0) sc[i] = { ...sc[i], ...nd };
  }
  persist(); api.syncSchedule(dk(_getCurDate()), sc);
  document.getElementById('blockModal').classList.remove('show');
  _renderSchedule();
}

export function initBlockDeleteBtn() {
  document.getElementById('bmDelete').onclick = () => {
    if (!confirm('Удалить блок?')) return;
    const sc = getSched(_getCurDate());
    const i  = sc.findIndex(b => b.id === bmId);
    if (i >= 0) sc.splice(i, 1);
    persist();
    document.getElementById('blockModal').classList.remove('show');
    _renderSchedule();
  };
}
