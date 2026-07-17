const telegramService = require('../services/TelegramService');

class TelegramController {
  generateCode(req, res) {
    const code = telegramService.generateCode(req.user.id);
    res.json({ code });
  }

  getStatus(req, res) {
    res.json({ linked: telegramService.isLinked(req.user.id) });
  }

  unlink(req, res) {
    telegramService.unlink(req.user.id);
    res.json({ ok: true });
  }
}

module.exports = new TelegramController();
