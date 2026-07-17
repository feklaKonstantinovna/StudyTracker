const nodemailer = require('nodemailer');
const config     = require('../config');

class EmailService {
  constructor() {
    this._transporter = nodemailer.createTransport({
      host:   config.SMTP.host,
      port:   config.SMTP.port,
      secure: false,
      auth:   { user: config.SMTP.user, pass: config.SMTP.pass },
    });
  }

  isConfigured() {
    return !!config.SMTP.user;
  }

  async sendMagicLink(toEmail, link) {
    await this._transporter.sendMail({
      from:    config.SMTP.from,
      to:      toEmail,
      subject: '🔐 Войти в StudyFlow',
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px">
          <h2 style="color:#7c6ff7">StudyFlow</h2>
          <p>Нажми кнопку, чтобы войти. Ссылка действует <strong>30 минут</strong>.</p>
          <a href="${link}" style="display:inline-block;background:#7c6ff7;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
            ✅ Войти в StudyFlow
          </a>
          <p style="color:#999;font-size:12px">Если не запрашивала — проигнорируй.</p>
        </div>`,
    });
  }
}

module.exports = new EmailService();
