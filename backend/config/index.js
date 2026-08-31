require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';
if (isProd && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET обязателен в production');
}

module.exports = {
  PORT:       process.env.PORT       || 3001,
  JWT_SECRET: process.env.JWT_SECRET || (isProd ? undefined : 'dev-secret-change-me'),
  APP_URL:    process.env.APP_URL    || null,

  SMTP: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'StudyFlow <noreply@studyflow.app>',
  },

  TELEGRAM: {
    token:          process.env.TELEGRAM_BOT_TOKEN,
    reminderHour:   process.env.REMINDER_HOUR   || '9',
    reminderMinute: process.env.REMINDER_MINUTE || '0',
  },

  RATE_LIMIT: {
    auth: { windowMs: 15 * 60 * 1000, max: 5 },
    api:  { windowMs: 60 * 1000,      max: 120 },
  },

  TOKEN_TTL: {
    authMinutes:    30,
    accessSeconds:  3600,
    refreshDays:    90,
    telegramMinutes: 10,
  },
};
