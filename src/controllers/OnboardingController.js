import { ST, persist, newGoalId, getSched } from '../state.js';
import { applyBuiltinTemplate } from './TemplateController.js';
import { showToast } from '../utils/toast.js';

let _getCurDate, _renderHome;

export function initOnboarding(getCurDate, renderHome) {
  _getCurDate = getCurDate;
  _renderHome = renderHome;
  maybeShowOnboarding();
}

export function maybeShowOnboarding() {
  if (localStorage.getItem('sf_skip_onboard') === '1') return;
  const sc = getSched(_getCurDate());
  if (sc && sc.length > 0) return;
  openOnboarding();
}

export function openOnboarding() {
  const overlay = document.getElementById('onboardOverlay');
  if (!overlay) return;
  overlay.classList.add('show');
  showStep(1);
  const title = (ST.learningGoals || []).find(g => g.status !== 'done')?.title || '';
  const inp = document.getElementById('onboardGoal');
  if (inp && title) inp.value = title;
}

export function closeOnboarding() {
  document.getElementById('onboardOverlay')?.classList.remove('show');
  localStorage.setItem('sf_skip_onboard', '1');
}

function showStep(n) {
  [1, 2, 3].forEach(i => {
    document.getElementById('onboardStep' + i)?.classList.toggle('show', i === n);
  });
  const overlay = document.getElementById('onboardOverlay');
  if (overlay) overlay.dataset.step = String(n);
}

export function recommendTemplate(title) {
  const t = String(title || '').toLowerCase();
  if (/qa|тест|баг|aqa|quality/.test(t)) return 'tpl-qa-eve';
  if (/sql|join|селект|таблиц|postgres|запрос/.test(t)) return 'tpl-sql';
  if (/react|frontend|вёрстк|верстк|css|html|javascript|(^|[^a-zа-яё])js([^a-zа-яё]|$)/.test(t)) return 'tpl-fe';
  if (/backend|api|spring|сервер|endpoint|django|node/.test(t)) return 'tpl-be';
  if (/алгоритм|leetcode|собес|interview|codewars/.test(t)) return 'tpl-algo';
  if (/english|англ|язык|ielts/.test(t)) return 'tpl-lang';
  return 'tpl-study';
}

export function onboardNext() {
  const overlay = document.getElementById('onboardOverlay');
  const step = parseInt(overlay?.dataset.step || '1', 10);
  if (step === 1) {
    const title = document.getElementById('onboardGoal')?.value.trim();
    if (!title) { showToast('Напиши, чему учишься'); return; }
    saveQuickGoal(title);
    const rec = recommendTemplate(title);
    const radio = document.querySelector(`input[name="onboardTpl"][value="${rec}"]`);
    if (radio) radio.checked = true;
    showStep(2);
    return;
  }
  if (step === 2) {
    const id = document.querySelector('input[name="onboardTpl"]:checked')?.value;
    if (!id) { showToast('Выбери шаблон'); return; }
    overlay.dataset.tpl = id;
    showStep(3);
    return;
  }
  const tpl = overlay.dataset.tpl;
  if (tpl) applyBuiltinTemplate(tpl);
  localStorage.setItem('sf_skip_onboard', '1');
  overlay.classList.remove('show');
  _renderHome?.();
  showToast('День собран. Можно начинать');
}

export function onboardBack() {
  const overlay = document.getElementById('onboardOverlay');
  const step = parseInt(overlay?.dataset.step || '1', 10);
  if (step > 1) showStep(step - 1);
}

function saveQuickGoal(title) {
  if (!ST.learningGoals) ST.learningGoals = [];
  const existing = ST.learningGoals.find(g => g.status === 'active');
  if (existing) { existing.title = title; persist(); return; }
  ST.learningGoals.push({
    id: newGoalId(),
    title,
    topicId: null,
    targetHours: 0,
    targetDate: null,
    status: 'active',
  });
  persist();
}
