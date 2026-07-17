const router    = require('express').Router();
const schedule  = require('../controllers/ScheduleController');
const dayData   = require('../controllers/DayDataController');
const calendar  = require('../controllers/CalendarController');
const kanban    = require('../controllers/KanbanController');
const analytics = require('../controllers/AnalyticsController');
const goals     = require('../controllers/GoalsController');
const userDataRepo = require('../repositories/UserDataRepository');

// ── Bulk sync ──────────────────────────────────────────────────────────────────
router.get('/data',  (req, res) => {
  const entry = userDataRepo.getMeta(req.user.id);
  if (!entry) return res.json({ data: null });
  res.json({ data: entry.data, updated_at: entry.updatedAt });
});
router.post('/data', (req, res) => {
  const { data } = req.body;
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Нет данных' });
  userDataRepo.set(req.user.id, data);
  res.json({ ok: true, updated_at: new Date().toISOString() });
});

// ── Schedule ───────────────────────────────────────────────────────────────────
router.get('/schedule/:date',    (req, res) => schedule.getBlocks(req, res));
router.post('/schedule/:date',   (req, res) => schedule.setBlocks(req, res));
router.delete('/schedule/:date', (req, res) => schedule.deleteBlocks(req, res));

// ── Templates ──────────────────────────────────────────────────────────────────
router.get('/templates',      (req, res) => schedule.getTemplates(req, res));
router.post('/templates',     (req, res) => schedule.createTemplate(req, res));
router.delete('/templates/:id', (req, res) => schedule.deleteTemplate(req, res));

// ── Day data ───────────────────────────────────────────────────────────────────
router.get('/daydata/:date',                               (req, res) => dayData.get(req, res));
router.post('/daydata/:date',                              (req, res) => dayData.set(req, res));
router.patch('/daydata/:date/block/:blockId/done',         (req, res) => dayData.patchBlockDone(req, res));
router.patch('/daydata/:date/task/:taskId/done',           (req, res) => dayData.patchTaskDone(req, res));
router.patch('/daydata/:date/block/:blockId/comment',      (req, res) => dayData.patchBlockComment(req, res));
router.patch('/daydata/:date/task/:taskId/comment',        (req, res) => dayData.patchTaskComment(req, res));

// ── Calendar ───────────────────────────────────────────────────────────────────
router.get('/calendar/:year/:month', (req, res) => calendar.getMonth(req, res));

// ── Kanban ─────────────────────────────────────────────────────────────────────
router.get('/kanban/cols',        (req, res) => kanban.getCols(req, res));
router.post('/kanban/cols',       (req, res) => kanban.createCol(req, res));
router.put('/kanban/cols/:id',    (req, res) => kanban.updateCol(req, res));
router.delete('/kanban/cols/:id', (req, res) => kanban.deleteCol(req, res));
router.get('/kanban/cards',       (req, res) => kanban.getCards(req, res));
router.post('/kanban/cards',      (req, res) => kanban.createCard(req, res));
router.put('/kanban/cards/:id',   (req, res) => kanban.updateCard(req, res));
router.delete('/kanban/cards/:id',(req, res) => kanban.deleteCard(req, res));

// ── Analytics ──────────────────────────────────────────────────────────────────
router.get('/analytics', (req, res) => analytics.get(req, res));

// ── Goals ──────────────────────────────────────────────────────────────────────
router.get('/goals',  (req, res) => goals.get(req, res));
router.post('/goals', (req, res) => goals.set(req, res));

module.exports = router;
