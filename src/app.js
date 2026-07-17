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
} from './controllers/TemplateController.js';
import {
  initAuth, updateAuthBanner, loadFromServer, authEmail, authLogout, openTelegramLink,
} from './controllers/AuthController.js';
import { renderMonetize } from './controllers/MonetizeController.js';

// ── App-level date state ──────────────────────────────────────────────────────
let curDate = new Date();
const getCurDate = () => curDate;
const setCurDate = (d) => { curDate = d; };

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = ['schedule','calendar','kanban','analytics','topics','monetize'];

function switchTab(id) {
  TABS.forEach(t => {
    document.getElementById('tab-' + t)?.classList.toggle('active', t === id);
    document.getElementById('tab-btn-' + t)?.classList.toggle('active', t === id);
  });
  localStorage.setItem('sf_tab', id);
  if (id === 'calendar')  renderCal();
  if (id === 'kanban')    { syncScheduleToKanbanSilent(); renderKanban(); }
  if (id === 'analytics') renderAnalytics();
  if (id === 'topics')    renderTopics();
  if (id === 'monetize')  renderMonetize();
}

// ── Init all controllers ──────────────────────────────────────────────────────
initTimer(getCurDate);
initSchedule(getCurDate, setCurDate, renderSchedule);
initBlockModal(getCurDate, renderSchedule);
initTaskModal(getCurDate, renderSchedule);
initMiniCal(getCurDate, setCurDate, renderSchedule);
initCalendar(getCurDate, setCurDate, switchTab, renderSchedule);
initKanban(getCurDate);
initGoals(renderAnalytics);
initTemplates(getCurDate, renderSchedule);
initAuth(renderSchedule);

initBlockDeleteBtn();
initKcDeleteBtn();
closeAllEmoji();

if ('Notification' in window && Notification.permission !== 'granted') Notification.requestPermission();

// ── Expose functions to window (for onclick= attributes in HTML) ──────────────
window.switchTab         = switchTab;
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

// ── Theme + initial render ────────────────────────────────────────────────────
applyTheme(localStorage.getItem('sf_theme') === 'light');

if (localStorage.getItem('sf_jwt')) { updateAuthBanner(); loadFromServer(); }

renderSchedule();

const lastTab = localStorage.getItem('sf_tab');
if (lastTab && TABS.includes(lastTab) && lastTab !== 'schedule') switchTab(lastTab);
