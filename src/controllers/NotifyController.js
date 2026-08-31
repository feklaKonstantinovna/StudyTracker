import { ST } from '../state.js';
import { dk } from '../utils/dateUtils.js';

export function initNotify() {
  const box = document.getElementById('eveningReportToggle');
  if (box) box.checked = localStorage.getItem('sf_evening_report') === '1';
  maybeEveningReport();
}

export async function toggleEveningReport(on) {
  if (on) {
    if (!('Notification' in window)) return;
    const perm = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();
    if (perm !== 'granted') {
      localStorage.setItem('sf_evening_report', '0');
      const box = document.getElementById('eveningReportToggle');
      if (box) box.checked = false;
      return;
    }
    localStorage.setItem('sf_evening_report', '1');
  } else {
    localStorage.setItem('sf_evening_report', '0');
  }
}

function maybeEveningReport() {
  if (localStorage.getItem('sf_evening_report') !== '1') return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date();
  if (now.getHours() < 21) return;
  const key = 'sf_evening_sent_' + dk(now);
  if (localStorage.getItem(key) === '1') return;
  const sc = ST.schedules[dk(now)] || [];
  const dd = ST.dayData[dk(now)] || { bd: {} };
  const main = sc.filter(b => !b.isBreak);
  const done = main.filter(b => dd.bd[b.id]).length;
  const pct = main.length ? Math.round(done / main.length * 100) : 0;
  try {
    new Notification('StudyFlow — итог дня', {
      body: main.length ? `Закрыто ${done} из ${main.length} блоков (${pct}%)` : 'Сегодня блоков не было',
    });
    localStorage.setItem(key, '1');
  } catch {}
}
