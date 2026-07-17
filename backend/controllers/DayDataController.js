const dayDataService = require('../services/DayDataService');
const { validateDate, badRequest } = require('../utils/validation');

class DayDataController {
  get(req, res) {
    if (!validateDate(req.params.date)) return badRequest(res, 'Неверный формат даты');
    const dd = dayDataService.get(req.user.id, req.params.date);
    res.json({ date: req.params.date, ...dd });
  }

  set(req, res) {
    if (!validateDate(req.params.date)) return badRequest(res, 'Неверный формат даты');
    const { bd, td, bc, tc, ts } = req.body;
    dayDataService.set(req.user.id, req.params.date, { bd, td, bc, tc, ts });
    res.json({ ok: true });
  }

  patchBlockDone(req, res) {
    if (!validateDate(req.params.date)) return badRequest(res, 'Неверный формат даты');
    const { done, tasksDone } = req.body;
    if (typeof done !== 'boolean') return badRequest(res, 'done должен быть boolean');
    dayDataService.patchBlockDone(req.user.id, req.params.date, req.params.blockId, done, tasksDone);
    res.json({ ok: true, blockId: req.params.blockId, done });
  }

  patchTaskDone(req, res) {
    if (!validateDate(req.params.date)) return badRequest(res, 'Неверный формат даты');
    const { done, blockId, blockDone } = req.body;
    if (typeof done !== 'boolean') return badRequest(res, 'done должен быть boolean');
    dayDataService.patchTaskDone(req.user.id, req.params.date, req.params.taskId, done, blockId, blockDone);
    res.json({ ok: true, taskId: req.params.taskId, done });
  }

  patchBlockComment(req, res) {
    if (!validateDate(req.params.date)) return badRequest(res, 'Неверный формат даты');
    const { comment } = req.body;
    if (typeof comment !== 'string') return badRequest(res, 'comment должен быть строкой');
    dayDataService.patchBlockComment(req.user.id, req.params.date, req.params.blockId, comment);
    res.json({ ok: true });
  }

  patchTaskComment(req, res) {
    if (!validateDate(req.params.date)) return badRequest(res, 'Неверный формат даты');
    const { comment } = req.body;
    if (typeof comment !== 'string') return badRequest(res, 'comment должен быть строкой');
    dayDataService.patchTaskComment(req.user.id, req.params.date, req.params.taskId, comment);
    res.json({ ok: true });
  }
}

module.exports = new DayDataController();
