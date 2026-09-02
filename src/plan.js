const KEY = 'sf_plan';
const PROMO = 'STUDYFLOW-PRO';

export function backendHost() {
  return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}

export function readPlan() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!raw || typeof raw !== 'object') {
      return { plan: 'free', proUntil: null, source: null, previewStartedAt: null };
    }
    const expired = raw.plan === 'pro' && raw.proUntil && new Date(raw.proUntil) <= new Date();
    return {
      plan: expired ? 'free' : (raw.plan === 'pro' ? 'pro' : 'free'),
      proUntil: expired ? null : (raw.proUntil || null),
      source: raw.source || null,
      previewStartedAt: raw.previewStartedAt || null,
    };
  } catch {
    return { plan: 'free', proUntil: null, source: null, previewStartedAt: null };
  }
}

export function writePlan(p) {
  const cur = readPlan();
  localStorage.setItem(KEY, JSON.stringify({
    plan: p.plan === 'pro' ? 'pro' : 'free',
    proUntil: p.proUntil || null,
    source: p.source || cur.source || null,
    previewStartedAt: p.previewStartedAt !== undefined ? p.previewStartedAt : cur.previewStartedAt,
  }));
}

export function isPro() {
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

export function canUseNowTools() {
  if (isPro()) return true;
  const p = readPlan();
  if (!p.previewStartedAt) return true;
  const start = new Date(p.previewStartedAt);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return new Date() <= end;
}

export function startNowPreview() {
  const p = readPlan();
  if (!p.previewStartedAt) writePlan({ ...p, previewStartedAt: new Date().toISOString() });
}

export const PROMO_CODE = PROMO;
