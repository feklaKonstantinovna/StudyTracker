const goalsService = require('../services/GoalsService');
const { badRequest } = require('../utils/validation');

class GoalsController {
  get(req, res) {
    res.json({ goals: goalsService.get(req.user.id) });
  }

  set(req, res) {
    // Support both old format {goals: {}} and new format {goals: []} (LearningGoal array)
    const body = req.body;
    const goals = body.goals;
    if (goals === undefined) return badRequest(res, 'goals обязателен');
    goalsService.set(req.user.id, goals);
    res.json({ ok: true });
  }
}

module.exports = new GoalsController();
