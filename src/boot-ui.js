export function patchShell() {
  document.getElementById('tab-btn-monetize')?.remove();
  document.getElementById('tab-monetize')?.remove();

  const sideNav = document.querySelector('.sidebar');
  if (sideNav && !document.getElementById('tab-btn-pricing')) {
    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.id = 'tab-btn-pricing';
    btn.dataset.testid = 'tab-btn-pricing';
    btn.textContent = '💳 Тарифы';
    btn.setAttribute('onclick', "switchTab('pricing')");
    const topics = document.getElementById('tab-btn-topics');
    if (topics?.nextSibling) sideNav.insertBefore(btn, topics.nextSibling);
    else sideNav.appendChild(btn);
  }
  if (!document.getElementById('tab-pricing')) {
    const main = document.querySelector('.main-content');
    const pane = document.createElement('div');
    pane.className = 'tab-content';
    pane.id = 'tab-pricing';
    pane.dataset.testid = 'tab-pricing';
    pane.innerHTML = '<div id="pricingContent" data-testid="pricing-content"></div>';
    main?.appendChild(pane);
  }
  if (!document.getElementById('pricingModal')) {
    const m = document.createElement('div');
    m.className = 'modal-overlay';
    m.id = 'pricingModal';
    m.dataset.testid = 'modal-pricing';
    m.innerHTML = `<div class="modal" style="max-width:640px"><div id="pricingModalBody"></div>
      <div class="modal-btns"><button class="btn btn-ghost btn-sm" onclick="closePricingModal()">Закрыть</button></div></div>`;
    document.body.appendChild(m);
  }

  const side = document.querySelector('.sidebar');
  if (side && !document.getElementById('tab-btn-more')) {
    const more = document.createElement('div');
    more.innerHTML = `<button class="tab-btn hidden-nav" onclick="switchTab('kanban')" id="tab-btn-kanban">📋 Канбан</button>
      <div class="more-wrap">
        <button class="tab-btn" onclick="toggleMoreMenu()" id="tab-btn-more">⋯ Ещё</button>
        <div class="more-menu" id="moreMenu">
          <div id="kanbanMoreWrap"><button class="tab-btn" onclick="openKanbanFromMore()" id="tab-btn-kanban-more">📋 Канбан</button></div>
          <button class="tab-btn" onclick="openOnboarding()">🚀 Онбординг</button>
        </div>
      </div>`;
    const theme = document.getElementById('themeBtn');
    const extras = document.createElement('div');
    extras.innerHTML = `<button class="tab-btn" onclick="downloadBackupJson()">⬇ Бэкап JSON</button>
      <label class="tab-btn" style="cursor:pointer">⬆ Восстановить<input type="file" accept="application/json" hidden onchange="restoreBackupJson(event)"></label>
      <button class="tab-btn" onclick="saveToCloud()" data-testid="btn-save-cloud">☁ Сохранить в облако</button>
      <div id="lastSyncStatus" data-testid="last-sync-status" style="font-size:10px;color:var(--muted);padding:0 12px 8px"></div>
      <label class="tab-btn" style="font-size:11px;color:var(--muted)">
        <input type="checkbox" id="eveningReportToggle" onchange="toggleEveningReport(this.checked)"> Вечерний отчёт
      </label>`;
    if (theme) { side.insertBefore(more, theme); side.insertBefore(extras, theme); }
    else { side.appendChild(more); side.appendChild(extras); }
  }

  if (!document.getElementById('sidebarScrim')) {
    const scrim = document.createElement('div');
    scrim.className = 'sidebar-scrim';
    scrim.id = 'sidebarScrim';
    scrim.onclick = () => window.closeSidebar?.();
    document.body.prepend(scrim);
  }

  const main = document.querySelector('.main-content');
  if (main && !document.querySelector('.topbar')) {
    const bar = document.createElement('div');
    bar.className = 'topbar';
    bar.innerHTML = '<button class="hamburger" onclick="toggleSidebar()" aria-label="Меню">☰</button><div style="font-weight:700;color:var(--ac2)">StudyFlow</div>';
    main.prepend(bar);
  }

  const sched = document.getElementById('tab-schedule');
  if (sched && !document.getElementById('nearestGoal')) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<div id="nearestGoal" class="card" style="display:none;margin-bottom:12px"></div>
      <div id="ankiTail" class="card" style="display:none;margin-bottom:12px"></div>
      <div class="day-dock">
        <button class="btn btn-ghost btn-sm" onclick="openNewBlockModal()">＋ Блок</button>
        <button class="btn btn-ghost btn-sm" onclick="openTplModal()">Шаблоны</button>
        <button class="btn btn-ghost btn-sm" onclick="copyScheduleToTomorrow()">На завтра</button>
      </div>`;
    sched.appendChild(wrap);
  }

  if (!document.getElementById('onboardOverlay')) {
    const o = document.createElement('div');
    o.className = 'onboard-overlay';
    o.id = 'onboardOverlay';
    o.dataset.step = '1';
    o.innerHTML = `<div class="onboard-card">
        <div class="onboard-step show" id="onboardStep1">
          <div class="modal-title">Чему учишься?</div>
          <input class="fld" id="onboardGoal" placeholder="Например: SQL JOIN">
          <div class="modal-btns">
            <button class="btn btn-ghost btn-sm" onclick="closeOnboarding()">Пропустить</button>
            <button class="btn btn-primary btn-sm" onclick="onboardNext()">Дальше</button>
          </div>
        </div>
        <div class="onboard-step" id="onboardStep2">
          <div class="modal-title">Шаблон на сегодня</div>
          <div class="tpl-pick">
            <label><input type="radio" name="onboardTpl" value="tpl-qa-eve"> QA после работы</label>
            <label><input type="radio" name="onboardTpl" value="tpl-sql"> SQL-день</label>
            <label><input type="radio" name="onboardTpl" value="tpl-fe"> Frontend-день</label>
            <label><input type="radio" name="onboardTpl" value="tpl-be"> Backend-день</label>
            <label><input type="radio" name="onboardTpl" value="tpl-algo"> Алгоритмы к собесу</label>
            <label><input type="radio" name="onboardTpl" value="tpl-study"> Учёба — 3 блока</label>
            <label><input type="radio" name="onboardTpl" value="tpl-qa"> QA-день</label>
            <label><input type="radio" name="onboardTpl" value="tpl-lang"> Язык</label>
            <label><input type="radio" name="onboardTpl" value="tpl-pomo4"> Короткий фокус 4×25</label>
            <label><input type="radio" name="onboardTpl" value="tpl-anki-we"> Выходной — только Anki</label>
            <label><input type="radio" name="onboardTpl" value="tpl-soft"> Мягкий вход после срыва</label>
          </div>
          <div class="modal-btns">
            <button class="btn btn-ghost btn-sm" onclick="onboardBack()">Назад</button>
            <button class="btn btn-primary btn-sm" onclick="onboardNext()">Дальше</button>
          </div>
        </div>
        <div class="onboard-step" id="onboardStep3">
          <div class="modal-title">Собрать день</div>
          <p style="font-size:13px;color:var(--muted);margin-bottom:12px">Цель сохранена. Шаблон станет расписанием на сегодня.</p>
          <label style="display:flex;gap:8px;align-items:flex-start;font-size:13px;margin-bottom:12px">
            <input type="checkbox" id="onboardWantTg" data-testid="onboard-want-tg">
            <span>Хочу напоминания в Telegram</span>
          </label>
          <div class="modal-btns">
            <button class="btn btn-ghost btn-sm" onclick="onboardBack()">Назад</button>
            <button class="btn btn-primary btn-sm" onclick="onboardNext()">Создать сегодня</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(o);
  }

  if (!document.getElementById('sf-runtime-css')) {
    const s = document.createElement('style');
    s.id = 'sf-runtime-css';
    s.textContent = `.hidden-nav{display:none!important;}
.topbar{display:none;align-items:center;gap:10px;padding:10px 12px;position:sticky;top:0;z-index:180;background:var(--s1);border-bottom:1px solid var(--border);}
.hamburger{background:var(--s2);border:1px solid var(--border);color:var(--text);width:36px;height:36px;border-radius:8px;font-size:18px;}
.sidebar-scrim{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:190;}
.sidebar-scrim.show{display:block;}
.more-menu{display:none;flex-direction:column;gap:2px;padding:4px 0 4px 12px;}
.more-menu.open{display:flex;}
.day-dock{display:none;}
.onboard-overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:800;display:none;align-items:center;justify-content:center;padding:16px;}
.onboard-overlay.show{display:flex;}
.onboard-card{background:var(--s1);border:1px solid var(--border);border-radius:16px;padding:20px;max-width:420px;width:100%;}
.onboard-step{display:none;}
.onboard-step.show{display:block;}
.tpl-pick{display:flex;flex-direction:column;gap:8px;}
.tpl-pick label{background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:10px 12px;cursor:pointer;}
.plan-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.plan-card{background:var(--s1);border:1px solid var(--border);border-radius:12px;padding:14px;}
.plan-card-pro{border-color:rgba(124,111,247,.4);}
.plan-name{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;}
.plan-price{font-size:22px;font-weight:700;color:var(--ac2);margin:6px 0;}
.plan-price-free{font-size:22px;font-weight:700;margin:6px 0;}
.plan-offer{font-size:12px;color:var(--muted);margin-bottom:8px;}
.plan-list{font-size:13px;padding-left:18px;margin:0 0 12px;color:var(--text);}
.plan-badge-pro{display:inline-block;background:var(--ac3);color:var(--ac2);border-radius:99px;padding:3px 10px;font-size:12px;margin-bottom:10px;}
@media(max-width:720px){.plan-grid{grid-template-columns:1fr;}}
@media(max-width:720px){
  .sidebar{position:fixed!important;left:-280px!important;top:0;width:220px!important;transform:none!important;transition:left .2s;}
  .sidebar.open{left:0!important;}
  .main-content,.app-layout{margin-left:0!important;padding-left:0!important;}
  .topbar{display:flex;}
  .tab-content{padding:14px 12px 88px;}
  .day-dock{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:170;background:var(--s1);border-top:1px solid var(--border);padding:8px;gap:6px;justify-content:space-around;}
}`;
    document.head.appendChild(s);
  }
}
