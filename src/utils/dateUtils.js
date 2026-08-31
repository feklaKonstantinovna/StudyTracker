export const DAYS = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
export const MONTHS_R = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
export const MONTHS_F = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
export const MONTHS_S = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
export const DAYS_SHORT = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];

export function dk(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function isWE(d) { return d.getDay() === 0 || d.getDay() === 6; }
export function pad(n) { return String(n).padStart(2, '0'); }
export function fmtT(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sc = s % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sc)}` : `${pad(m)}:${pad(sc)}`;
}
export function stopProp(e) { e.stopPropagation(); }
