import { isPro, readPlan, activateLocalPromo, backendHost, writePlan } from '../plan.js';
import { showToast } from '../utils/toast.js';
import { API } from '../config.js';
import { sfJWT } from '../services/ApiService.js';

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const p = n => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function trackFunnel(event) {
  if (!backendHost()) return;
  fetch(API + '/api/funnel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event }),
  }).catch(() => {});
}

export function openPricingModal(reason) {
  if (reason === 'sync') trackFunnel('sync_blocked_free');
  if (reason === 'telegram') trackFunnel('telegram_blocked_free');
  trackFunnel('view_pricing');
  const modal = document.getElementById('pricingModal');
  if (modal) modal.classList.add('show');
  renderPricing();
}

export function closePricingModal() {
  document.getElementById('pricingModal')?.classList.remove('show');
}

export function renderPricing() {
  const root = document.getElementById('pricingContent');
  const modalBody = document.getElementById('pricingModalBody');
  if (root) root.innerHTML = pricingHtml(true);
  if (modalBody) modalBody.innerHTML = pricingHtml(false);
}

function pricingHtml(withTestIds) {
  const tid = (name) => withTestIds ? ` data-testid="${name}"` : '';
  const pro = isPro();
  const p = readPlan();
  const pages = !backendHost();
  const badge = pro
    ? `<div class="plan-badge-pro"${tid('plan-badge-pro')}>Pro до ${fmtDate(p.proUntil)}</div>`
    : '';
  return `
    <h2 style="font-size:18px;margin-bottom:6px">Учись на любом устройстве, не теряя день</h2>
    <p style="font-size:13px;color:var(--muted);margin-bottom:14px">Free хранит план в браузере. Pro синхронизирует прогресс и присылает утреннее и вечернее сообщение в Telegram.</p>
    ${badge}
    ${pages ? '<p style="font-size:12px;color:var(--muted);margin-bottom:12px">На GitHub Pages облако выключено. Pro работает, когда запущен свой сервер.</p>' : ''}
    <div class="plan-grid">
      <div class="plan-card"${tid('plan-card-free')}>
        <div class="plan-name">Free</div>
        <div class="plan-price-free">0 ₽</div>
        <ul class="plan-list">
          <li>Трекер в браузере без регистрации</li>
          <li>Дни, блоки, шаблоны, цели</li>
          <li>Бэкап JSON и экспорт CSV</li>
          <li>Без облака и без Telegram</li>
        </ul>
        <button class="btn btn-ghost btn-sm" onclick="closePricingModal()">Остаться на Free — данные никуда не денутся</button>
      </div>
      <div class="plan-card plan-card-pro"${tid('plan-card-pro')}>
        <div class="plan-name">Pro</div>
        <div class="plan-price"${tid('plan-price')}>399 ₽/мес</div>
        <p class="plan-offer">Один аккаунт, облако + Telegram-напоминания</p>
        <ul class="plan-list">
          <li>Синхронизация между устройствами</li>
          <li>Утро и вечер в Telegram</li>
          <li>Шаблоны в облаке</li>
          <li>Сохранить в облако + last sync</li>
        </ul>
        <button class="btn btn-primary btn-sm"${tid('btn-activate-promo')} onclick="openPromoForm()">Активировать Pro</button>
        <div class="promo-form" style="display:none;margin-top:8px">
          <input class="fld promo-code-input"${tid('promo-code-input')} placeholder="Промокод">
          <button class="btn btn-ghost btn-sm" style="margin-top:6px"${tid('btn-promo-submit')} onclick="submitPromoCode()">Активировать промокодом</button>
        </div>
      </div>
    </div>`;
}

export function openPromoForm() {
  document.querySelectorAll('.promo-form').forEach(form => { form.style.display = 'block'; });
}

export async function submitPromoCode() {
  const visible = [...document.querySelectorAll('.promo-code-input')].find(el => el.offsetParent !== null);
  const code = visible?.value || document.querySelector('.promo-code-input')?.value || '';
  const local = activateLocalPromo(code);
  if (!local.ok) {
    trackFunnel('promo_activate_fail');
    showToast(local.error);
    return;
  }
  if (backendHost() && sfJWT) {
    try {
      await fetch(API + '/auth/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + sfJWT },
        body: JSON.stringify({ code }),
      });
    } catch {}
  }
  trackFunnel('promo_activate_ok');
  showToast('Pro на 30 дней');
  renderPricing();
}

export async function saveToCloud() {
  if (!isPro()) { openPricingModal('sync'); return; }
  const { persist } = await import('../state.js');
  persist();
  const el = document.getElementById('lastSyncStatus');
  if (el) el.textContent = 'last sync: ' + new Date().toLocaleTimeString('ru-RU');
  showToast('Сохранено в облако');
}

export function applyPlanFromMe(me) {
  if (!me || !me.plan) return;
  writePlan({ plan: me.plan, proUntil: me.proUntil, source: me.source || 'manual' });
}
