const config      = require('../config');
const authService = require('../services/AuthService');
const emailService = require('../services/EmailService');
const { validateEmail, badRequest } = require('../utils/validation');

class AuthController {
  async sendMagicLink(req, res) {
    const { email } = req.body;
    if (!validateEmail(email)) return badRequest(res, 'Неверный формат email');

    const baseUrl = config.APP_URL || `http://localhost:${config.PORT}`;
    const { link } = authService.generateMagicToken(email, baseUrl);

    if (!emailService.isConfigured()) {
      return res.json({ ok: true, devLink: link, message: 'DEV: кликни по ссылке ниже чтобы войти' });
    }

    try {
      await emailService.sendMagicLink(email, link);
      res.json({ ok: true, message: `Ссылка отправлена на ${email}` });
    } catch (err) {
      console.error('Email error:', err.message);
      res.status(500).json({ error: 'Ошибка отправки. Проверь SMTP настройки в .env' });
    }
  }

  verifyMagicLink(req, res) {
    const { token } = req.query;
    if (!token) return res.status(400).send('Токен отсутствует');

    const result = authService.verifyMagicToken(token);
    if (!result.ok) return res.status(400).send(`<h2 style="font-family:sans-serif">${result.error}</h2>`);

    const { user, accessToken, refreshToken } = result;
    res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Вход в StudyFlow</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:60px;background:#0c0c12;color:#e8e8f0">
        <h2 style="color:#7c6ff7">✅ Авторизация успешна!</h2>
        <p>Перенаправление в приложение...</p>
        <script>
          localStorage.setItem('sf_jwt',     ${JSON.stringify(accessToken)});
          localStorage.setItem('sf_refresh', ${JSON.stringify(refreshToken)});
          localStorage.setItem('sf_email',   ${JSON.stringify(user.email)});
          setTimeout(() => { window.location.href = '/study-tracker_2.html'; }, 800);
        </script>
      </body></html>`);
  }

  refreshToken(req, res) {
    const { refreshToken } = req.body;
    if (!refreshToken) return badRequest(res, 'refreshToken обязателен');

    const result = authService.refreshAccess(refreshToken);
    if (!result.ok) return res.status(401).json({ error: result.error });

    res.json({ accessToken: result.accessToken, email: result.email });
  }

  me(req, res) {
    res.json({ id: req.user.id, email: req.user.email });
  }

  logout(req, res) {
    authService.revokeRefresh(req.body.refreshToken);
    res.json({ ok: true });
  }
}

module.exports = new AuthController();
