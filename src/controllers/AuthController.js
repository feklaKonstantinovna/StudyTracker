import { API } from '../config.js';
import { apiReq, sfJWT, sfEmail, setJWT, setEmail } from '../services/ApiService.js';
import { showToast } from '../utils/toast.js';
import { ST, replaceWithServerData, persist } from '../state.js';

let _renderSchedule;
export function initAuth(renderFn) { _renderSchedule = renderFn; }

export async function loadFromServer() {
  if (!sfJWT) return;
  const res = await apiReq('GET', '/data');
  if (res && res.data) {
    replaceWithServerData(res.data);
    _renderSchedule();
    showToast('☁️ Данные загружены с сервера');
  }
}

export function updateAuthBanner() {
  const banner = document.getElementById('authBanner');
  if (!banner) return;
  const email  = localStorage.getItem('sf_email');
  const localOnly = location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';
  if (email && !localOnly) {
    banner.innerHTML = `
      <div style="font-size:20px">✅</div>
      <div class="auth-banner-text" data-testid="auth-banner-email"><b>Вошла как ${email}</b> — синхронизация с твоим backend.</div>
      <div class="auth-btns">
        <button class="btn btn-sm btn-ghost" onclick="window._openTelegramLink()" data-testid="btn-telegram-link">🤖 Telegram</button>
        <button class="btn btn-sm btn-danger" onclick="window._authLogout()" data-testid="btn-logout">Выйти</button>
      </div>`;
    return;
  }
  banner.innerHTML = `
    <div style="font-size:20px">💾</div>
    <div class="auth-banner-text"><b>Данные живут в этом браузере.</b> Облако на GitHub Pages нет — синхронизация только если запущен свой backend.</div>
    <div class="auth-btns">
      <button class="btn btn-sm btn-email-auth" onclick="window._authEmail()" data-testid="btn-auth-email">✉️ Email</button>
    </div>`;
}

export async function authEmail() {
  const email = prompt('Введи email:');
  if (!email || !email.includes('@')) return;
  showToast('✉️ Отправляю...');
  const res = await fetch(API + '/auth/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }).then(r => r.json()).catch(() => null);
  if (!res) { showToast('❌ Сервер недоступен. Запусти backend/server.js', 4000); return; }
  if (res.error) { showToast('❌ ' + res.error, 4000); return; }
  if (res.devLink) { showDevLoginModal(email, res.devLink); }
  else { showToast(`✉️ Ссылка отправлена на ${email}. Проверь почту!`, 5000); }
}

function showDevLoginModal(email, link) {
  document.getElementById('devLoginModal')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'devLoginModal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
  overlay.innerHTML = `
    <div style="background:var(--s1);border:1px solid var(--border);border-radius:16px;padding:28px 24px;max-width:400px;width:100%;text-align:center">
      <div style="font-size:32px;margin-bottom:12px">✉️</div>
      <div style="font-size:16px;font-weight:700;margin-bottom:6px">Ссылка для входа</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:20px">Email: <b style="color:var(--text)">${email}</b></div>
      <a href="${link}" style="display:block;background:var(--ac);color:#fff;padding:13px 20px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:12px" onclick="document.getElementById('devLoginModal').remove()">
        ✅ Войти в StudyFlow
      </a>
      <button onclick="document.getElementById('devLoginModal').remove()" style="background:var(--s3);border:1px solid var(--border);color:var(--muted);padding:6px 16px;border-radius:8px;font-size:12px;cursor:pointer">Закрыть</button>
    </div>`;
  document.body.appendChild(overlay);
}

export function authLogout() {
  setJWT(null); setEmail(null);
  localStorage.removeItem('sf_jwt');
  localStorage.removeItem('sf_email');
  localStorage.removeItem('sf_refresh');
  updateAuthBanner();
  showToast('Вышла из аккаунта');
}

export async function openTelegramLink() {
  if (!sfJWT) { showToast('Сначала войди по email'); return; }
  const statusRes = await apiReq('GET', '/telegram/status');
  if (statusRes?.linked) {
    if (confirm('Telegram уже привязан. Отвязать?')) { await apiReq('POST', '/telegram/unlink'); showToast('✅ Telegram отвязан'); }
    return;
  }
  const res = await apiReq('POST', '/telegram/code');
  if (!res || !res.code) { showToast('❌ Ошибка получения кода', 4000); return; }
  alert(`🤖 Твой код для Telegram: ${res.code}\n\n1. Открой @StudyFlowBot в Telegram\n2. Отправь: /link ${res.code}\n\nКод действует 10 минут.`);
}
