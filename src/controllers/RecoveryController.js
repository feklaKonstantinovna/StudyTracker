import { ST, getSched, persist, newBlockId, newTaskId } from '../state.js';
import { dk } from '../utils/dateUtils.js';
import { escapeHtml } from '../utils/sanitize.js';
import { showToast } from '../utils/toast.js';
import { canUseNowTools, startNowPreview } from '../plan.js';
import { trackEvent } from '../events.js';

function yesterdayOf(d) {
  const y = new Date(d);
  y.setDate(y.getDate() - 1);
  return y;
}

export function collectDebt(today) {
  const y = yesterdayOf(today);
  const yk = dk(y);
  const sc = ST.schedules[yk] || [];
  const dd = ST.dayData[yk] || { bd: {}, td: {} };
  const items = [];
  sc.forEach(block => {
    const carry = block.carryCount || 0;
    if (!block.isBreak && !dd.bd[block.id] && carry < 2) {
      items.push({ key: 'b:' + block.id, type: 'block', title: block.title || block.name || 'Блок', blockId: block.id, date: yk, carry });
    }
    (block.tasks || []).forEach(task => {
      const tc = task.carryCount || 0;
      if (task.anki && !dd.td[task.id] && tc < 2) {
        items.push({ key: 't:' + task.id, type: 'anki', title: task.text || 'Anki', blockId: block.id, taskId: task.id, date: yk, carry: tc });
      }
    });
  });
  return items;
}

export function renderDebt(today) {
  const root = document.getElementById('debtCard');
  if (!root) return;
  const items = collectDebt(today);
  if (!items.length) { root.style.display = 'none'; root.innerHTML = ''; return; }
  root.style.display = 'block';
  root.innerHTML = `
    <div class="section-title">Закрыть долг</div>
    <ul class="debt-list" data-testid="debt-list">
      ${items.map(i => `<li data-testid="debt-item">${escapeHtml(i.title)}${i.type === 'anki' ? ' · Anki' : ''}</li>`).join('')}
    </ul>
    <button class="btn btn-ghost btn-sm" data-testid="btn-soft-day" onclick="buildSoftDay()">Собрать мягкий день</button>
  `;
}

export function buildSoftDay() {
  trackEvent('recovery_click');
  if (!canUseNowTools()) {
    window.openPricingModal?.();
    showToast('Пробные 7 дней кончились — мягкий день в Pro');
    return;
  }
  startNowPreview();
  const today = window._getCurDate?.() || new Date();
  const sc = getSched(today);
  if (sc.length > 0) {
    showToast('Сегодня уже есть блоки — не затираю расписание');
    return;
  }
  const items = collectDebt(today);
  const anki = items.filter(i => i.type === 'anki');
  const yk = dk(yesterdayOf(today));
  const ysc = ST.schedules[yk] || [];
  anki.forEach(item => {
    const block = ysc.find(b => b.id === item.blockId);
    const task = (block?.tasks || []).find(t => t.id === item.taskId);
    if (task) task.carryCount = (task.carryCount || 0) + 1;
  });
  items.filter(i => i.type === 'block').forEach(item => {
    const block = ysc.find(b => b.id === item.blockId);
    if (block) block.carryCount = (block.carryCount || 0) + 1;
  });
  const tasks = anki.map(i => ({ id: newTaskId(), text: i.title, anki: true, carryCount: 0 }));
  sc.push({
    id: newBlockId(), title: 'Мягкий день', name: 'Мягкий день', sub: 'Долг Anki',
    time: '10:00', dur: 25, icon: '🌱', cls: 'ic-anki', isBreak: false, tasks, softDay: true,
  });
  persist();
  window.renderHome?.();
  showToast(tasks.length ? 'Собрала короткий день из Anki-долга' : 'Собрала короткий блок на 25 минут');
}
