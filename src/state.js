import { LS, API } from './config.js';
import { DEF_SCHED, DEF_WEEKEND } from './data/defaults.js';
import { dk, isWE } from './utils/dateUtils.js';

function load() {
  try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch { return {}; }
}

export const ST = load();
_ensureFields(ST);

function _ensureFields(s) {
  if (!s.schedules)   s.schedules   = {};
  if (!s.dayData)     s.dayData     = {};
  if (!s.kanbanCols)  s.kanbanCols  = [
    {id:'kc1',title:'К изучению',color:'#7c6ff7'},
    {id:'kc2',title:'В процессе',color:'#fbbf24'},
    {id:'kc3',title:'Повторить', color:'#22d3ee'},
    {id:'kc4',title:'Готово',    color:'#4ade80'},
  ];
  if (!s.kanbanCards) s.kanbanCards = [];
  if (!s.templates)   s.templates   = [];
  if (!s.goals)       s.goals       = {};
  if (!s.topics)      s.topics      = [];
  if (!s.learningGoals) s.learningGoals = [];
  if (s.points == null) s.points = 0;
  if (!s.updatedAt) s.updatedAt = new Date().toISOString();
}

export function migrate() {
  _ensureFields(ST);
}

export function replaceWithServerData(serverData) {
  Object.keys(ST).forEach(k => { delete ST[k]; });
  Object.assign(ST, serverData);
  _ensureFields(ST);
}

let saveTimer = null;
export function persist() {
  ST.updatedAt = new Date().toISOString();
  localStorage.setItem(LS, JSON.stringify(ST));
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const jwt = localStorage.getItem('sf_jwt');
    if (!jwt) return;
    if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
    fetch(API + '/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
      body: JSON.stringify({ data: ST, updatedAt: ST.updatedAt }),
    }).catch(() => {});
  }, 1500);
}

export function getSched(d) {
  const k = dk(d);
  if (!ST.schedules[k]) {
    ST.schedules[k] = [];
    persist();
  }
  return ST.schedules[k];
}

export function getDayD(d) {
  const k = dk(d);
  if (!ST.dayData[k]) ST.dayData[k] = { bd:{}, td:{}, bc:{}, tc:{}, ts:{} };
  return ST.dayData[k];
}

export function getMissedStreak(today) {
  let streak = 0;
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = dk(d);
    const sc = ST.schedules[k];
    if (!sc || !sc.length) continue;
    const dd = ST.dayData[k] || { bd: {} };
    const main = sc.filter(b => !b.isBreak);
    if (!main.length) continue;
    const done = main.filter(b => dd.bd[b.id]).length;
    if (done === 0) streak++;
    else break;
  }
  return streak;
}

export function recoveryPlan(streak) {
  if (streak <= 0) return null;
  if (streak === 1) return {
    mode: 'half',
    title: 'Вчера сорвалось — сегодня меньше',
    text: 'Не догоняй. Оставь 1 главный блок или примерно половину нагрузки.',
  };
  if (streak <= 4) return {
    mode: 'soft',
    title: 'Мягкий вход',
    text: '1 блок на 25–40 минут. Возврат уже считается.',
  };
  return {
    mode: 'reset',
    title: 'Сначала вернуться',
    text: 'Пересобери 1 короткий блок и держи минимум 3 дня. Без наверстывания.',
  };
}

export function addPoints(n) {
  ST.points = (ST.points || 0) + n;
  persist();
}

export function newBlockId() { return 'b' + Date.now() + Math.random().toString(36).slice(2,5); }
export function newTaskId()  { return 't' + Date.now() + Math.random().toString(36).slice(2,5); }
export function newTopicId() { return 'tp' + Date.now() + Math.random().toString(36).slice(2,5); }
export function newGoalId()  { return 'gl' + Date.now() + Math.random().toString(36).slice(2,5); }

migrate();
void DEF_SCHED; void DEF_WEEKEND; void isWE;
persist();
