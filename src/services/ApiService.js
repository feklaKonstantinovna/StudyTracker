import { API } from '../config.js';
import { showToast } from '../utils/toast.js';

export let sfJWT   = localStorage.getItem('sf_jwt')   || null;
export let sfEmail = localStorage.getItem('sf_email') || null;

export function setJWT(v)   { sfJWT   = v; }
export function setEmail(v) { sfEmail = v; }

export function rawApiReq(method, path, body) {
  if (!sfJWT) return Promise.resolve(null);
  const opts = { method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sfJWT } };
  if (body) opts.body = JSON.stringify(body);
  return fetch(API + path, opts).then(r => r.ok ? r.json() : null).catch(() => null);
}

async function tryRefreshToken() {
  const rt = localStorage.getItem('sf_refresh');
  if (!rt) return false;
  try {
    const res = await fetch(API + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.accessToken) {
      sfJWT = data.accessToken;
      localStorage.setItem('sf_jwt', sfJWT);
      return true;
    }
  } catch {}
  return false;
}

export async function apiReq(method, path, body) {
  if (!sfJWT) return null;
  const opts = { method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sfJWT } };
  if (body) opts.body = JSON.stringify(body);
  let res = await fetch(API + path, opts).catch(() => null);
  if (res && res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      opts.headers['Authorization'] = 'Bearer ' + sfJWT;
      res = await fetch(API + path, opts).catch(() => null);
    } else {
      sfJWT = null; sfEmail = null;
      localStorage.removeItem('sf_jwt');
      localStorage.removeItem('sf_email');
      localStorage.removeItem('sf_refresh');
      showToast('Сессия истекла. Войди снова.', 4000);
      return null;
    }
  }
  return res ? res.json().catch(() => null) : null;
}

// Granular sync helpers — fire-and-forget
export const api = {
  syncBlockDone:   (date, blockId, done, tasksDone) =>
    apiReq('PATCH', `/api/daydata/${date}/block/${blockId}/done`, { done, tasksDone }),
  syncTaskDone:    (date, taskId, done, blockId, blockDone) =>
    apiReq('PATCH', `/api/daydata/${date}/task/${taskId}/done`,  { done, blockId, blockDone }),
  syncBlockComment:(date, blockId, comment) =>
    apiReq('PATCH', `/api/daydata/${date}/block/${blockId}/comment`, { comment }),
  syncTaskComment: (date, taskId, comment) =>
    apiReq('PATCH', `/api/daydata/${date}/task/${taskId}/comment`,   { comment }),
  syncSchedule:    (date, blocks) => apiReq('POST', `/api/schedule/${date}`, { blocks }),
  syncKanbanCard:  (card, isNew)  => isNew ? apiReq('POST',  '/api/kanban/cards',       card)
                                           : apiReq('PUT',   `/api/kanban/cards/${card.id}`, card),
  deleteKanbanCard:(id)           => apiReq('DELETE', `/api/kanban/cards/${id}`),
  syncKanbanCol:   (col, isNew)   => isNew ? apiReq('POST',  '/api/kanban/cols',        col)
                                           : apiReq('PUT',   `/api/kanban/cols/${col.id}`, col),
  deleteKanbanCol: (id)           => apiReq('DELETE', `/api/kanban/cols/${id}`),
  syncTopics:      (topics)       => apiReq('PUT',    '/api/topics',   { topics }),
  syncGoals:       (goals)        => apiReq('PUT',    '/api/goals',    { goals }),
};
