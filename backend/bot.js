require('./config');
const TelegramBot    = require('node-telegram-bot-api');
const cron           = require('node-cron');
const config         = require('./config');
const telegramSvc    = require('./services/TelegramService');
const userDataRepo   = require('./repositories/UserDataRepository');
const telegramRepo   = require('./repositories/TelegramRepository');
const db             = require('./repositories/Database');
const { toDateKey }  = require('./utils/dateUtils');

const TOKEN = config.TELEGRAM.token;
if (!TOKEN) { console.error('❌ TELEGRAM_BOT_TOKEN не задан в .env'); process.exit(1); }

const bot = new TelegramBot(TOKEN, { polling: true });
console.log('🤖 Telegram бот запущен...');

// ── Stats helpers ──────────────────────────────────────────────────────────────

class StatsFormatter {
  static compute(data) {
    if (!data) return null;
    const today = toDateKey();
    const sched = data.schedules?.[today];
    const dd    = data.dayData?.[today];
    if (!sched) return null;

    const main   = sched.filter(b => !b.isBreak);
    const done   = main.filter(b => dd?.bd?.[b.id]).length;
    const tasks  = sched.flatMap(b => b.tasks || []);
    const dTasks = tasks.filter(t => dd?.td?.[t.id]).length;
    const pct    = main.length ? Math.round(done / main.length * 100) : 0;
    return { done, total: main.length, dTasks, tTasks: tasks.length, pct };
  }

  static format(stats) {
    if (!stats) return '📅 Расписание на сегодня ещё не задано.';
    const bar = '▓'.repeat(Math.round(stats.pct / 10)) + '░'.repeat(10 - Math.round(stats.pct / 10));
    return `📊 *Прогресс сегодня:*\n${bar} ${stats.pct}%\n\n✅ Блоков: ${stats.done}/${stats.total}\n📝 Задач: ${stats.dTasks}/${stats.tTasks}`;
  }
}

// ── Command handlers ───────────────────────────────────────────────────────────

class BotCommandHandler {
  constructor(bot) {
    this.bot = bot;
  }

  handleStart(chatId) {
    this.bot.sendMessage(chatId, `
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
/unlink — отвязать аккаунт
    `.trim(), { parse_mode: 'Markdown' });
  }

  handleLink(chatId, code) {
    const result = telegramSvc.linkByCode(code, chatId);
    if (!result.ok) { this.bot.sendMessage(chatId, `❌ ${result.error}`); return; }
    this.bot.sendMessage(chatId, `
✅ *Аккаунт привязан!*

Email: ${result.user.email}

Теперь я буду присылать тебе:
• ⏰ Утренние напоминания о начале занятий
• 📊 Вечерние отчёты о прогрессе
• 🎉 Поздравления при выполнении плана

Напиши /stats чтобы увидеть прогресс прямо сейчас.
    `.trim(), { parse_mode: 'Markdown' });
  }

  handleStats(chatId) {
    const user = telegramSvc.getUserByChatId(chatId);
    if (!user) { this.bot.sendMessage(chatId, '❗ Аккаунт не привязан. Используй /link <код>'); return; }
    const data  = userDataRepo.get(user.id);
    const stats = StatsFormatter.compute(data);
    this.bot.sendMessage(chatId, StatsFormatter.format(stats), { parse_mode: 'Markdown' });
  }

  handleWeek(chatId) {
    const user = telegramSvc.getUserByChatId(chatId);
    if (!user) { this.bot.sendMessage(chatId, '❗ Аккаунт не привязан. Используй /link <код>'); return; }
    const data = userDataRepo.get(user.id);
    if (!data)  { this.bot.sendMessage(chatId, '📅 Нет данных.'); return; }

    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    let text = '📅 *Статистика за 7 дней:*\n\n';

    for (let i = 6; i >= 0; i--) {
      const d   = new Date(); d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      const sched = data.schedules?.[key];
      const dd    = data.dayData?.[key];
      const day   = dayNames[d.getDay()];

      if (!sched) { text += `${day} ${d.getDate()} — нет данных\n`; continue; }

      const main = sched.filter(b => !b.isBreak);
      const done = main.filter(b => dd?.bd?.[b.id]).length;
      const pct  = main.length ? Math.round(done / main.length * 100) : 0;
      const emoji = pct >= 80 ? '🟩' : pct > 0 ? '🟨' : '⬛';
      text += `${emoji} ${day} ${d.getDate()} — ${done}/${main.length} блоков (${pct}%)\n`;
    }

    this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  }

  handleUnlink(chatId) {
    const user = telegramSvc.getUserByChatId(chatId);
    if (!user) { this.bot.sendMessage(chatId, '❗ Аккаунт не привязан.'); return; }
    telegramSvc.unlink(user.id);
    this.bot.sendMessage(chatId, '✅ Аккаунт отвязан. Используй /link чтобы привязать снова.');
  }
}

const handler = new BotCommandHandler(bot);

bot.onText(/\/start/,    msg => handler.handleStart(msg.chat.id));
bot.onText(/\/link (.+)/,(msg, m) => handler.handleLink(msg.chat.id, m[1].trim()));
bot.onText(/\/stats/,    msg => handler.handleStats(msg.chat.id));
bot.onText(/\/week/,     msg => handler.handleWeek(msg.chat.id));
bot.onText(/\/unlink/,   msg => handler.handleUnlink(msg.chat.id));

const KNOWN_COMMANDS = ['/start', '/link', '/stats', '/week', '/unlink', '/reminder'];
bot.on('message', msg => {
  if (!msg.text?.startsWith('/')) return;
  if (!KNOWN_COMMANDS.some(cmd => msg.text.startsWith(cmd)))
    bot.sendMessage(msg.chat.id, 'Неизвестная команда. Напиши /start чтобы увидеть список команд.');
});

// ── Cron reminders ─────────────────────────────────────────────────────────────

class CronService {
  constructor(bot) { this.bot = bot; }

  sendMorningReminders() {
    telegramSvc.getAllLinkedUsers().forEach(({ userId, chatId }) => {
      const data  = userDataRepo.get(userId);
      const today = toDateKey();
      const sched = data?.schedules?.[today];
      if (!sched) return;

      const firstBlock = sched.find(b => !b.isBreak);
      if (!firstBlock) return;

      this.bot.sendMessage(chatId, `
☀️ *Доброе утро!*

Сегодня ${new Date().toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })}.

Первый блок: *${firstBlock.icon} ${firstBlock.title}*
🕐 Начало в ${firstBlock.time}

Удачи в учёбе! 💪
      `.trim(), { parse_mode: 'Markdown' });
    });
  }

  sendEveningReports() {
    telegramSvc.getAllLinkedUsers().forEach(({ userId, chatId }) => {
      const data  = userDataRepo.get(userId);
      const stats = StatsFormatter.compute(data);
      if (!stats) return;

      let msg = StatsFormatter.format(stats) + '\n\n';
      if      (stats.pct >= 100) msg += '🎉 *Отличная работа! План выполнен на 100%!*';
      else if (stats.pct >=  80) msg += '💪 Почти! Ещё немного — и план выполнен!';
      else if (stats.pct >=  50) msg += '📈 Хороший прогресс! Завтра ещё лучше.';
      else                       msg += '💡 Не забудь продолжить учёбу сегодня!';

      this.bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
    });
  }
}

const cronService = new CronService(bot);
const { reminderHour, reminderMinute } = config.TELEGRAM;

cron.schedule(`${reminderMinute} ${reminderHour} * * *`,
  () => cronService.sendMorningReminders(),
  { timezone: 'Europe/Moscow' }
);

cron.schedule('0 21 * * *',
  () => cronService.sendEveningReports(),
  { timezone: 'Europe/Moscow' }
);

console.log(`⏰ Напоминание настроено на ${reminderHour}:${String(reminderMinute).padStart(2,'0')} МСК`);
console.log('📊 Вечерний отчёт: 21:00 МСК');
