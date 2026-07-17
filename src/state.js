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
}

export function replaceWithServerData(serverData) {
  Object.keys(ST).forEach(k => { delete ST[k]; });
  Object.assign(ST, serverData);
  _ensureFields(ST);
}

let saveTimer = null;
export function persist() {
  localStorage.setItem(LS, JSON.stringify(ST));
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const jwt = localStorage.getItem('sf_jwt');
    if (!jwt) return;
    fetch(API + '/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
      body: JSON.stringify({ data: ST }),
    }).catch(() => {});
  }, 1500);
}

export function getSched(d) {
  const k = dk(d);
  if (!ST.schedules[k]) {
    ST.schedules[k] = JSON.parse(JSON.stringify(isWE(d) ? DEF_WEEKEND : DEF_SCHED));
    persist();
  }
  return ST.schedules[k];
}

export function getDayD(d) {
  const k = dk(d);
  if (!ST.dayData[k]) ST.dayData[k] = { bd:{}, td:{}, bc:{}, tc:{}, ts:{} };
  return ST.dayData[k];
}

export function newBlockId() { return 'b' + Date.now() + Math.random().toString(36).slice(2,5); }
export function newTaskId()  { return 't' + Date.now() + Math.random().toString(36).slice(2,5); }
export function newTopicId() { return 'tp' + Date.now() + Math.random().toString(36).slice(2,5); }
export function newGoalId()  { return 'gl' + Date.now() + Math.random().toString(36).slice(2,5); }

persist();
