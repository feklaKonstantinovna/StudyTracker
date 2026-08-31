export function patchShell() {
  document.getElementById('tab-btn-monetize')?.remove();
  document.getElementById('tab-monetize')?.remove();

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
            <label><input type="radio" name="onboardTpl" value="tpl-qa"> QA-день</label>
            <label><input type="radio" name="onboardTpl" value="tpl-lang"> Язык</label>
            <label><input type="radio" name="onboardTpl" value="tpl-pomo4"> Короткий фокус 4×25</label>
            <label><input type="radio" name="onboardTpl" value="tpl-anki-we"> Выходной — только Anki</label>
          </div>
          <div class="modal-btns">
            <button class="btn btn-ghost btn-sm" onclick="onboardBack()">Назад</button>
            <button class="btn btn-primary btn-sm" onclick="onboardNext()">Дальше</button>
          </div>
        </div>
        <div class="onboard-step" id="onboardStep3">
          <div class="modal-title">Собрать день</div>
          <p style="font-size:13px;color:var(--muted);margin-bottom:12px">Цель сохранена. Шаблон станет расписанием на сегодня.</p>
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
@media(max-width:720px){
  .sidebar{position:fixed!important;left:-240px!important;top:0;width:220px;transform:none!important;transition:left .2s;}
  .sidebar.open{left:0!important;}
  .main-content{margin-left:0!important;}
  .topbar{display:flex;}
  .tab-content{padding:14px 12px 88px;}
  .day-dock{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:170;background:var(--s1);border-top:1px solid var(--border);padding:8px;gap:6px;justify-content:space-around;}
}`;
    document.head.appendChild(s);
  }
}
