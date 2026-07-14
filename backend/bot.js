require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const { getUserByChatId, getUserData, linkTelegramByCode, getAllLinkedUsers } = require('./server');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN не задан в .env');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });
console.log('🤖 Telegram бот запущен...');

// ── HELPERS ───────────────────────────────────────────────────────────────────
function dk(d) {
  return d.toISOString().split('T')[0];
}

function getTodayStats(data) {
  if (!data) return null;
  const today = dk(new Date());
  const sched = data.schedules?.[today];
  const dd = data.dayData?.[today];
  if (!sched) return null;
  const main = sched.filter(b => !b.isBreak);
  const done = main.filter(b => dd?.bd?.[b.id]).length;
  const tasks = sched.flatMap(b => b.tasks || []);
  const dTasks = tasks.filter(t => dd?.td?.[t.id]).length;
  const pct = main.length ? Math.round(done / main.length * 100) : 0;
  return { done, total: main.length, dTasks, tTasks: tasks.length, pct };
}

function formatProgress(stats) {
  if (!stats) return '📅 Расписание на сегодня ещё не задано.';
  const bar = '▓'.repeat(Math.round(stats.pct / 10)) + '░'.repeat(10 - Math.round(stats.pct / 10));
  return `
📊 *Прогресс сегодня:*
${bar} ${stats.pct}%

✅ Блоков: ${stats.done}/${stats.total}
📝 Задач: ${stats.dTasks}/${stats.tTasks}
  `.trim();
}

// ── COMMANDS ──────────────────────────────────────────────────────────────────

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `
👋 Привет! Я бот StudyFlow.

Я буду присылать тебе напоминания о занятиях и отчёты о прогрессе.

*Как подключиться:*
1. Открой StudyFlow в браузере
2. Войди по email
3. Перейди в настройки → Telegram
4. Получи 6-значный код
5. Отправь мне: /link 123456

*Команды:*
/link \\<код\\> — привязать аккаунт
/stats — прогресс сегодня
/week — статистика недели
/reminder — настроить напоминание
/unlink — отвязать аккаунт
  `.trim(), { parse_mode: 'Markdown' });
});

// /link <code> — привязать Telegram к аккаунту
bot.onText(/\/link (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const code = match[1].trim();
  const result = linkTelegramByCode(code, chatId);
  if (!result.ok) {
    bot.sendMessage(chatId, `❌ ${result.error}`);
    return;
  }
  bot.sendMessage(chatId, `
✅ *Аккаунт привязан!*

Email: ${result.user.email}

Теперь я буду присылать тебе:
• ⏰ Утренние напоминания о начале занятий
• 📊 Вечерние отчёты о прогрессе
• 🎉 Поздравления при выполнении плана

Напиши /stats чтобы увидеть прогресс прямо сейчас.
  `.trim(), { parse_mode: 'Markdown' });
});

// /stats — прогресс сегодня
bot.onText(/\/stats/, (msg) => {
  const chatId = msg.chat.id;
  const user = getUserByChatId(chatId);
  if (!user) {
    bot.sendMessage(chatId, '❗ Аккаунт не привязан. Используй /link <код>');
    return;
  }
  const data = getUserData(user.id);
  const stats = getTodayStats(data);
  bot.sendMessage(chatId, formatProgress(stats), { parse_mode: 'Markdown' });
});

// /week — статистика за неделю
bot.onText(/\/week/, (msg) => {
  const chatId = msg.chat.id;
  const user = getUserByChatId(chatId);
  if (!user) {
    bot.sendMessage(chatId, '❗ Аккаунт не привязан. Используй /link <код>');
    return;
  }
  const data = getUserData(user.id);
  if (!data) {
    bot.sendMessage(chatId, '📅 Нет данных.');
    return;
  }

  let text = '📅 *Статистика за 7 дней:*\n\n';
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = dk(d);
    const sched = data.schedules?.[k];
    const dd = data.dayData?.[k];
    const day = days[d.getDay()];
    if (!sched) {
      text += `${day} ${d.getDate()} — нет данных\n`;
      continue;
    }
    const main = sched.filter(b => !b.isBreak);
    const done = main.filter(b => dd?.bd?.[b.id]).length;
    const pct = main.length ? Math.round(done / main.length * 100) : 0;
    const emoji = pct >= 80 ? '🟩' : pct > 0 ? '🟨' : '⬛';
    text += `${emoji} ${day} ${d.getDate()} — ${done}/${main.length} блоков (${pct}%)\n`;
  }
  bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
});

// /unlink — отвязать аккаунт
bot.onText(/\/unlink/, (msg) => {
  const chatId = msg.chat.id;
  const user = getUserByChatId(chatId);
  if (!user) {
    bot.sendMessage(chatId, '❗ Аккаунт не привязан.');
    return;
  }
  const { readDB, writeDB } = require('./server');
  const db = readDB();
  if (db.telegramLinks) delete db.telegramLinks[user.id];
  writeDB(db);
  bot.sendMessage(chatId, '✅ Аккаунт отвязан. Используй /link чтобы привязать снова.');
});

// Неизвестная команда
bot.on('message', (msg) => {
  if (!msg.text?.startsWith('/')) return;
  const known = ['/start', '/link', '/stats', '/week', '/unlink', '/reminder'];
  if (!known.some(cmd => msg.text.startsWith(cmd))) {
    bot.sendMessage(msg.chat.id, 'Неизвестная команда. Напиши /start чтобы увидеть список команд.');
  }
});

// ── CRON REMINDERS ────────────────────────────────────────────────────────────

// Утреннее напоминание — по умолчанию 9:00 (МСК)
const reminderHour = process.env.REMINDER_HOUR || '9';
const reminderMin = process.env.REMINDER_MINUTE || '0';

cron.schedule(`${reminderMin} ${reminderHour} * * *`, () => {
  const users = getAllLinkedUsers();
  users.forEach(({ chat_id, user_id }) => {
    const data = getUserData(user_id);
    const today = dk(new Date());
    const sched = data?.schedules?.[today];
    if (!sched) return;

    const firstBlock = sched.find(b => !b.isBreak);
    if (!firstBlock) return;

    bot.sendMessage(chat_id, `
☀️ *Доброе утро!*

Сегодня ${new Date().toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })}.

Первый блок: *${firstBlock.icon} ${firstBlock.title}*
🕐 Начало в ${firstBlock.time}

Удачи в учёбе! 💪
    `.trim(), { parse_mode: 'Markdown' });
  });
}, { timezone: 'Europe/Moscow' });

// Вечерний отчёт — 21:00 МСК
cron.schedule('0 21 * * *', () => {
  const users = getAllLinkedUsers();
  users.forEach(({ chat_id, user_id }) => {
    const data = getUserData(user_id);
    const stats = getTodayStats(data);
    if (!stats) return;

    let msg = formatProgress(stats) + '\n\n';
    if (stats.pct >= 100) msg += '🎉 *Отличная работа! План выполнен на 100%!*';
    else if (stats.pct >= 80) msg += '💪 Почти! Ещё немного — и план выполнен!';
    else if (stats.pct >= 50) msg += '📈 Хороший прогресс! Завтра ещё лучше.';
    else msg += '💡 Не забудь продолжить учёбу сегодня!';

    bot.sendMessage(chat_id, msg, { parse_mode: 'Markdown' });
  });
}, { timezone: 'Europe/Moscow' });

console.log(`⏰ Напоминание настроено на ${reminderHour}:${String(reminderMin).padStart(2,'0')} МСК`);
console.log('📊 Вечерний отчёт: 21:00 МСК');
