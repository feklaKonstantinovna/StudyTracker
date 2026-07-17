const goalsService = require('../services/GoalsService');
const { badRequest } = require('../utils/validation');

class GoalsController {
  get(req, res) {
    res.json({ goals: goalsService.get(req.user.id) });
  }

  set(req, res) {
    const { goals } = req.body;
    if (!goals || typeof goals !== 'object') return badRequest(res, 'goals должен быть объектом');
    goalsService.set(req.user.id, goals);
    res.json({ ok: true });
  }
}

module.exports = new GoalsController();
