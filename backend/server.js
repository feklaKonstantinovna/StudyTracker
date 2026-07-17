const app    = require('./app');
const config = require('./config');

// exports for bot.js
const userRepo     = require('./repositories/UserRepository');
const userDataRepo = require('./repositories/UserDataRepository');
const db           = require('./repositories/Database');
const telegramRepo = require('./repositories/TelegramRepository');
const telegramSvc  = require('./services/TelegramService');

// ── Legacy exports (bot.js compatibility) ────────────────────────────────────
function readDB()       { return db.read(); }
function writeDB(state) { return db.write(state); }
function getUserData(userId) { return userDataRepo.get(userId); }
function getUserByChatId(chatId) { return telegramSvc.getUserByChatId(chatId); }
function linkTelegramByCode(code, chatId) { return telegramSvc.linkByCode(code, chatId); }
function getAllLinkedUsers() {
  return telegramSvc.getAllLinkedUsers().map(({ userId, chatId }) => ({ user_id: userId, chat_id: chatId }));
}

module.exports = { readDB, writeDB, getUserData, getUserByChatId, linkTelegramByCode, getAllLinkedUsers };

// ── Start ─────────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(config.PORT, () => {
    console.log(`\n🚀 StudyFlow сервер: http://localhost:${config.PORT}`);
    console.log(`📱 Приложение: http://localhost:${config.PORT}/study-tracker_2.html`);
    console.log(`\n📋 REST API: /api/schedule, /api/daydata, /api/calendar, /api/kanban, /api/analytics, /api/templates, /api/goals`);
    console.log(`🔒 Rate limiting: /auth/email → 5 req/15min | /api/* → 120 req/min`);
    console.log(`🤖 Telegram бот: запусти → node bot.js\n`);
    if (!process.env.SMTP_USER) console.log('⚠️  SMTP не настроен — magic link в ответе (dev mode)\n');
  });
}
