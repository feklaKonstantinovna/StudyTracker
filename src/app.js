// ── Entry point: wires all controllers, exposes globals for onclick= handlers ──

import { applyTheme, toggleTheme } from './controllers/ThemeController.js';
import { initTimer, startTimer, pauseTimer, resetTimer } from './controllers/TimerController.js';
import {
  initSchedule, renderSchedule, changeDay,
  toggleBlock, toggleBlockDone, toggleTask,
  saveBCom, updateDur, deleteTask, copyScheduleToTomorrow,
} from './controllers/ScheduleController.js';
import {
  initBlockModal, openBlockModal, openNewBlockModal, saveBlockModal, initBlockDeleteBtn,
} from './controllers/BlockModalController.js';
import {
  initTaskModal, openTaskModal, openNewTaskModal, saveTaskModal,
} from './controllers/TaskModalController.js';
import {
  toggleEmojiPicker, toggleEmojiPickerInto,
  renderEpCat, renderEpCatInto, pickEmoji, pickEmojiInto, closeAllEmoji,
} from './controllers/EmojiController.js';
import {
  initMiniCal, openMiniCal, closeMiniCal, mcChangeMonth, mcSelectDay,
} from './controllers/MiniCalendarController.js';
import {
  initCalendar, renderCal, calChange, calSelectDay, jumpToDay,
} from './controllers/CalendarController.js';
import {
  initKanban, syncScheduleToKanbanSilent, syncScheduleToKanban, renderKanban,
  dragKcStart, dragKcEnd, dropKc, delKanbanCol, addKanbanCol,
  openNewKcModal, openKcModal, saveKcModal, initKcDeleteBtn,
} from './controllers/KanbanController.js';
import { renderAnalytics, exportCSV } from './controllers/AnalyticsController.js';
import {
  renderTopics, openNewTopicModal, openTopicModal, saveTopicModal, deleteTopic,
} from './controllers/TopicsController.js';
import {
  initGoals, openGoalsModal, openAddGoalModal, openEditGoalModal, saveGoalModal, deleteGoal,
} from './controllers/GoalsController.js';
import {
  initTemplates, openTplModal, saveTemplate, applyTemplate, deleteTemplate,
  applyBuiltinTemplate, applyDemoSchedule,
} from './controllers/TemplateController.js';
import {
  initAuth, updateAuthBanner, loadFromServer, authEmail, authLogout, openTelegramLink,
} from './controllers/AuthController.js';
import { initOnboarding, openOnboarding, onboardNext, onboardBack, closeOnboarding } from './controllers/OnboardingController.js';
import { downloadBackupJson, restoreBackupJson } from './controllers/BackupController.js';
import { initAnki, renderAnkiTail, copyAnkiList } from './controllers/AnkiController.js';
import { initNotify, toggleEveningReport } from './controllers/NotifyController.js';
import { renderNearestGoal } from './controllers/HomeWidgetsController.js';
import { patchShell } from './boot-ui.js';

let curDate = new Date();
const getCurDate = () => curDate;
const setCurDate = (d) => { curDate = d; };

function kanbanVisible() {
  return localStorage.getItem('sf_show_kanban') === '1';
}

const TABS = ['schedule','calendar','kanban','analytics','topics','more'];

function switchTab(id) {
  if (id === 'kanban' && !kanbanVisible()) {
    document.getElementById('moreMenu')?.classList.toggle('open');
    return;
  }
  TABS.forEach(t => {
    document.getElementById('tab-' + t)?.classList.toggle('active', t === id);
    document.getElementById('tab-btn-' + t)?.classList.toggle('active', t === id);
  });
  document.getElementById('tab-btn-kanban-more')?.classList.toggle('active', id === 'kanban');
  localStorage.setItem('sf_tab', id === 'monetize' ? 'schedule' : id);
  closeSidebar();
  if (id === 'calendar')  renderCal();
  if (id === 'kanban')    { syncScheduleToKanbanSilent(); renderKanban(); }
  if (id === 'analytics') renderAnalytics();
  if (id === 'topics')    renderTopics();
}

function applyKanbanNav() {
  const show = kanbanVisible();
  document.getElementById('tab-btn-kanban')?.classList.toggle('hidden-nav', !show);
  document.getElementById('kanbanMoreWrap')?.classList.toggle('hidden-nav', show);
}

function toggleMoreMenu() {
  document.getElementById('moreMenu')?.classList.toggle('open');
}

function openKanbanFromMore() {
  localStorage.setItem('sf_show_kanban', '1');
  applyKanbanNav();
  switchTab('kanban');
}

function sidebarEl() {
  return document.getElementById('sidebar') || document.querySelector('.sidebar');
}
function toggleSidebar() {
  sidebarEl()?.classList.toggle('open');
  document.getElementById('sidebarScrim')?.classList.toggle('show');
}
function closeSidebar() {
  sidebarEl()?.classList.remove('open');
  document.getElementById('sidebarScrim')?.classList.remove('show');
}

const renderHome = () => {
  renderSchedule();
  renderNearestGoal();
  renderAnkiTail();
};

patchShell();

initTimer(getCurDate);
initSchedule(getCurDate, setCurDate, renderHome);
initBlockModal(getCurDate, renderHome);
initTaskModal(getCurDate, renderHome);
initMiniCal(getCurDate, setCurDate, renderHome);
initCalendar(getCurDate, setCurDate, switchTab, renderHome);
initKanban(getCurDate);
initGoals(renderAnalytics);
initTemplates(getCurDate, renderHome);
initAuth(renderHome);
initAnki(getCurDate);
initOnboarding(getCurDate, renderHome);
initNotify();
applyKanbanNav();
updateAuthBanner();

initBlockDeleteBtn();
initKcDeleteBtn();
closeAllEmoji();

window.switchTab         = switchTab;
window.toggleSidebar     = toggleSidebar;
window.closeSidebar      = closeSidebar;
window.toggleMoreMenu    = toggleMoreMenu;
window.openKanbanFromMore = openKanbanFromMore;
window.downloadBackupJson = downloadBackupJson;
window.restoreBackupJson = restoreBackupJson;
window.copyAnkiList      = copyAnkiList;
window.toggleEveningReport = toggleEveningReport;
window.openOnboarding    = openOnboarding;
window.onboardNext       = onboardNext;
window.onboardBack       = onboardBack;
window.closeOnboarding   = closeOnboarding;
window.changeDay         = changeDay;
window.openMiniCal       = openMiniCal;
window.closeMiniCal      = closeMiniCal;
window.mcChangeMonth     = mcChangeMonth;
window._mcSelectDay      = mcSelectDay;
window.calChange         = calChange;
window._calSelectDay     = calSelectDay;
window._jumpToDay        = jumpToDay;
window.openNewBlockModal = openNewBlockModal;
window.saveBlockModal    = saveBlockModal;
window._openBlockModal   = openBlockModal;
window.openNewTaskModal  = openNewTaskModal;
window._openNewTaskModal = openNewTaskModal;
window.saveTaskModal     = saveTaskModal;
window._openTaskModal    = openTaskModal;
window._toggleBlock      = toggleBlock;
window._toggleBlockDone  = toggleBlockDone;
window._toggleTask       = toggleTask;
window._saveBCom         = saveBCom;
window._updateDur        = updateDur;
window._deleteTask       = deleteTask;
window.copyScheduleToTomorrow = copyScheduleToTomorrow;
window.toggleEmojiPicker     = toggleEmojiPicker;
window.toggleEmojiPickerInto = toggleEmojiPickerInto;
window._renderEpCat          = renderEpCat;
window._renderEpCatInto      = renderEpCatInto;
window._pickEmoji            = pickEmoji;
window._pickEmojiInto        = pickEmojiInto;
window.openTplModal          = openTplModal;
window.saveTemplate          = saveTemplate;
window._applyTemplate        = applyTemplate;
window._applyBuiltinTemplate = applyBuiltinTemplate;
window._applyDemoSchedule    = applyDemoSchedule;
window._deleteTemplate       = deleteTemplate;
window.addKanbanCol          = addKanbanCol;
window.syncScheduleToKanban  = syncScheduleToKanban;
window.openNewKcModal        = openNewKcModal;
window.saveKcModal           = saveKcModal;
window._openKcModal          = openKcModal;
window._dragKcStart          = dragKcStart;
window._dragKcEnd            = dragKcEnd;
window._dropKc               = dropKc;
window._delKanbanCol         = delKanbanCol;
window.renderAnalytics       = renderAnalytics;
window.exportCSV             = exportCSV;
window.openGoalsModal        = openGoalsModal;
window._openGoalsModal       = openGoalsModal;
window.openAddGoalModal      = openAddGoalModal;
window.saveGoalModal         = saveGoalModal;
window._openEditGoalModal    = openEditGoalModal;
window._deleteGoal           = deleteGoal;
window._openNewTopicModal    = openNewTopicModal;
window._openTopicModal       = openTopicModal;
window.saveTopicModal        = saveTopicModal;
window._deleteTopic          = deleteTopic;
window.toggleTheme           = toggleTheme;
window._authEmail            = authEmail;
window.authEmail             = authEmail;
window._authLogout           = authLogout;
window._openTelegramLink     = openTelegramLink;
window._startTimer           = startTimer;
window._pauseTimer           = pauseTimer;
window._resetTimer           = resetTimer;

applyTheme(localStorage.getItem('sf_theme') === 'light');

function API_OK() {
  return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}

if (localStorage.getItem('sf_jwt') && API_OK()) { updateAuthBanner(); loadFromServer(); }

const savedTab = localStorage.getItem('sf_tab');
if (savedTab && savedTab !== 'monetize' && (savedTab !== 'kanban' || kanbanVisible())) switchTab(savedTab);
else switchTab('schedule');
renderHome();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
