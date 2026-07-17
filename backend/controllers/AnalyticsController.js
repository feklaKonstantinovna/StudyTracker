const analyticsService = require('../services/AnalyticsService');

class AnalyticsController {
  get(req, res) {
    const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 365);
    res.json(analyticsService.compute(req.user.id, days));
  }
}

module.exports = new AnalyticsController();
