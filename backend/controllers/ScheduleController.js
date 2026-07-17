const scheduleService = require('../services/ScheduleService');
const { validateDate, validateBlocks, badRequest } = require('../utils/validation');

class ScheduleController {
  getBlocks(req, res) {
    if (!validateDate(req.params.date)) return badRequest(res, 'Неверный формат даты (YYYY-MM-DD)');
    const blocks = scheduleService.getBlocks(req.user.id, req.params.date);
    res.json({ date: req.params.date, blocks });
  }

  setBlocks(req, res) {
    if (!validateDate(req.params.date)) return badRequest(res, 'Неверный формат даты (YYYY-MM-DD)');
    if (!validateBlocks(req.body.blocks)) return badRequest(res, 'blocks должен быть массивом объектов с id и title');
    scheduleService.setBlocks(req.user.id, req.params.date, req.body.blocks);
    res.json({ ok: true, date: req.params.date });
  }

  deleteBlocks(req, res) {
    if (!validateDate(req.params.date)) return badRequest(res, 'Неверный формат даты (YYYY-MM-DD)');
    scheduleService.deleteBlocks(req.user.id, req.params.date);
    res.json({ ok: true });
  }

  getTemplates(req, res) {
    res.json({ templates: scheduleService.getTemplates(req.user.id) });
  }

  createTemplate(req, res) {
    const { name, blocks } = req.body;
    if (!name || typeof name !== 'string') return badRequest(res, 'name обязателен');
    if (!validateBlocks(blocks))           return badRequest(res, 'blocks некорректный');
    const tpl = scheduleService.createTemplate(req.user.id, name, blocks);
    res.json({ ok: true, template: tpl });
  }

  deleteTemplate(req, res) {
    const deleted = scheduleService.deleteTemplate(req.user.id, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Шаблон не найден' });
    res.json({ ok: true });
  }
}

module.exports = new ScheduleController();
