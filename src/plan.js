const KEY = 'sf_plan';
const PROMO = 'STUDYFLOW-PRO';

export function backendHost() {
  return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}

export function readPlan() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!raw || typeof raw !== 'object') return { plan: 'free', proUntil: null, source: null };
    return {
      plan: raw.plan === 'pro' ? 'pro' : 'free',
      proUntil: raw.proUntil || null,
      source: raw.source || null,
    };
  } catch {
    return { plan: 'free', proUntil: null, source: null };
  }
}

export function writePlan(p) {
  localStorage.setItem(KEY, JSON.stringify({
    plan: p.plan === 'pro' ? 'pro' : 'free',
    proUntil: p.proUntil || null,
    source: p.source || null,
  }));
}

export function isPro() {
  if (!backendHost()) return false;
  const p = readPlan();
  if (p.plan !== 'pro') return false;
  if (!p.proUntil) return true;
  return new Date(p.proUntil) > new Date();
}

export function activateLocalPromo(code) {
  const ok = String(code || '').trim().toUpperCase() === PROMO;
  if (!ok) return { ok: false, error: 'Неверный промокод' };
  const until = new Date();
  until.setDate(until.getDate() + 30);
  writePlan({ plan: 'pro', proUntil: until.toISOString(), source: 'promo' });
  return { ok: true, plan: readPlan() };
}

export const PROMO_CODE = PROMO;
