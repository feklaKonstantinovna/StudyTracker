require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const DB_FILE = path.join(__dirname, 'db.json');

// ── JSON DATABASE ─────────────────────────────────────────────────────────────
function readDB() {
  if (!fs.existsSync(DB_FILE)) return { users: [], authTokens: [], refreshTokens: [], userData: {}, telegramLinks: {}, telegramCodes: {} };
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return { users: [], authTokens: [], refreshTokens: [], userData: {}, telegramLinks: {}, telegramCodes: {} }; }
}
function writeDB(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

function getUserData(userId) {
  const db = readDB();
  return db.userData[userId]?.data || { schedules: {}, dayData: {}, kanbanCols: [], kanbanCards: [], templates: [], goals: {} };
}
function setUserData(userId, data) {
  const db = readDB();
  db.userData[userId] = { data, updatedAt: new Date().toISOString() };
  writeDB(db);
}

// ── VALIDATION ────────────────────────────────────────────────────────────────
function validateEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
function validateDate(date) {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);
}
function validateBlocks(blocks) {
  if (!Array.isArray(blocks)) return false;
  return blocks.every(b => b && typeof b.id === 'string' && typeof b.title === 'string');
}
function badRequest(res, msg) {
  return res.status(400).json({ error: msg });
}

// ── EMAIL ─────────────────────────────────────────────────────────────────────
const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..')));

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: { error: 'Слишком много запросов. Повтори через 15 минут.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 120,
  message: { error: 'Слишком много запросов.' },
});

app.use('/auth/email', authLimiter);
app.use('/api/', apiLimiter);

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Не авторизован' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Токен недействителен или истёк' }); }
}

// ── AUTH ──────────────────────────────────────────────────────────────────────

app.post('/auth/email', async (req, res) => {
  const { email } = req.body;
  if (!validateEmail(email)) return badRequest(res, 'Неверный формат email');

  const db = readDB();
  let user = db.users.find(u => u.email === email.trim().toLowerCase());
  if (!user) {
    user = { id: Date.now().toString(), email: email.trim().toLowerCase(), createdAt: new Date().toISOString() };
    db.users.push(user);
  }
  const token = crypto.randomBytes(32).toString('hex');
  db.authTokens = (db.authTokens || []).filter(t => new Date(t.expiresAt) > new Date());
  db.authTokens.push({ token, userId: user.id, expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), used: false });
  writeDB(db);

  const link = `${process.env.APP_URL || 'http://localhost:' + PORT}/auth/verify?token=${token}`;

  if (!process.env.SMTP_USER) {
    // DEV mode: return the link in the response so the frontend can show it directly
    return res.json({ ok: true, devLink: link, message: 'DEV: кликни по ссылке ниже чтобы войти' });
  }
  try {
    await mailer.sendMail({
      from: process.env.EMAIL_FROM || 'StudyFlow <noreply@studyflow.app>',
      to: email,
      subject: '🔐 Войти в StudyFlow',
      html: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px">
        <h2 style="color:#7c6ff7">StudyFlow</h2>
        <p>Нажми кнопку, чтобы войти. Ссылка действует <strong>30 минут</strong>.</p>
        <a href="${link}" style="display:inline-block;background:#7c6ff7;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">✅ Войти в StudyFlow</a>
        <p style="color:#999;font-size:12px">Если не запрашивала — проигнорируй.</p>
      </div>`,
    });
    res.json({ ok: true, message: `Ссылка отправлена на ${email}` });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ error: 'Ошибка отправки. Проверь SMTP настройки в .env' });
  }
});

app.get('/auth/verify', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Токен отсутствует');
  const db = readDB();
  const row = (db.authTokens || []).find(t => t.token === token && !t.used);
  if (!row) return res.status(400).send('<h2 style="font-family:sans-serif">Ссылка недействительна или уже использована.</h2>');
  if (new Date(row.expiresAt) < new Date()) return res.status(400).send('<h2 style="font-family:sans-serif">Ссылка истекла. Запроси новую.</h2>');
  row.used = true;
  const user = db.users.find(u => u.id === row.userId);
  const accessToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = crypto.randomBytes(40).toString('hex');
  if (!db.refreshTokens) db.refreshTokens = [];
  db.refreshTokens = db.refreshTokens.filter(t => new Date(t.expiresAt) > new Date());
  db.refreshTokens.push({ token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() });
  writeDB(db);
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Вход в StudyFlow</title></head>
    <body style="font-family:sans-serif;text-align:center;padding:60px;background:#0c0c12;color:#e8e8f0">
      <h2 style="color:#7c6ff7">✅ Авторизация успешна!</h2>
      <p>Перенаправление в приложение...</p>
      <script>
        localStorage.setItem('sf_jwt', ${JSON.stringify(accessToken)});
        localStorage.setItem('sf_refresh', ${JSON.stringify(refreshToken)});
        localStorage.setItem('sf_email', ${JSON.stringify(user.email)});
        setTimeout(()=>{ window.location.href = '/study-tracker_2.html'; }, 800);
      </script>
    </body></html>`);
});

// POST /auth/refresh — обменять refresh token на новый access token
app.post('/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return badRequest(res, 'refreshToken обязателен');
  const db = readDB();
  const row = (db.refreshTokens || []).find(t => t.token === refreshToken);
  if (!row) return res.status(401).json({ error: 'Refresh token не найден или истёк' });
  if (new Date(row.expiresAt) < new Date()) {
    db.refreshTokens = db.refreshTokens.filter(t => t.token !== refreshToken);
    writeDB(db);
    return res.status(401).json({ error: 'Refresh token истёк. Войди снова.' });
  }
  const user = db.users.find(u => u.id === row.userId);
  if (!user) return res.status(401).json({ error: 'Пользователь не найден' });
  const accessToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ accessToken, email: user.email });
});

app.get('/auth/me', requireAuth, (req, res) => res.json({ id: req.user.id, email: req.user.email }));

app.post('/auth/logout', requireAuth, (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const db = readDB();
    db.refreshTokens = (db.refreshTokens || []).filter(t => t.token !== refreshToken);
    writeDB(db);
  }
  res.json({ ok: true });
});

// ── BULK SYNC (legacy + initial load) ────────────────────────────────────────

app.get('/data', requireAuth, (req, res) => {
  const db = readDB();
  const entry = db.userData[req.user.id];
  if (!entry) return res.json({ data: null });
  res.json({ data: entry.data, updated_at: entry.updatedAt });
});

app.post('/data', requireAuth, (req, res) => {
  const { data } = req.body;
  if (!data || typeof data !== 'object') return badRequest(res, 'Нет данных');
  setUserData(req.user.id, data);
  res.json({ ok: true, updated_at: new Date().toISOString() });
});

// ══════════════════════════════════════════════════════════════════════════════
// SCHEDULE TAB
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/schedule/:date', requireAuth, (req, res) => {
  if (!validateDate(req.params.date)) return badRequest(res, 'Неверный формат даты (YYYY-MM-DD)');
  const data = getUserData(req.user.id);
  res.json({ date: req.params.date, blocks: data.schedules?.[req.params.date] || null });
});

app.post('/api/schedule/:date', requireAuth, (req, res) => {
  if (!validateDate(req.params.date)) return badRequest(res, 'Неверный формат даты (YYYY-MM-DD)');
  const { blocks } = req.body;
  if (!validateBlocks(blocks)) return badRequest(res, 'blocks должен быть массивом объектов с id и title');
  const data = getUserData(req.user.id);
  if (!data.schedules) data.schedules = {};
  data.schedules[req.params.date] = blocks;
  setUserData(req.user.id, data);
  res.json({ ok: true, date: req.params.date });
});

app.delete('/api/schedule/:date', requireAuth, (req, res) => {
  if (!validateDate(req.params.date)) return badRequest(res, 'Неверный формат даты (YYYY-MM-DD)');
  const data = getUserData(req.user.id);
  if (data.schedules) delete data.schedules[req.params.date];
  setUserData(req.user.id, data);
  res.json({ ok: true });
});

// ── SCHEDULE TEMPLATES ────────────────────────────────────────────────────────

app.get('/api/templates', requireAuth, (req, res) => {
  const data = getUserData(req.user.id);
  res.json({ templates: data.templates || [] });
});

app.post('/api/templates', requireAuth, (req, res) => {
  const { name, blocks } = req.body;
  if (!name || typeof name !== 'string') return badRequest(res, 'name обязателен');
  if (!validateBlocks(blocks)) return badRequest(res, 'blocks некорректный');
  const data = getUserData(req.user.id);
  if (!data.templates) data.templates = [];
  const tpl = { id: 'tpl' + Date.now(), name: name.trim(), blocks, createdAt: new Date().toISOString() };
  data.templates.push(tpl);
  setUserData(req.user.id, data);
  res.json({ ok: true, template: tpl });
});

app.delete('/api/templates/:id', requireAuth, (req, res) => {
  const data = getUserData(req.user.id);
  const before = data.templates?.length || 0;
  data.templates = (data.templates || []).filter(t => t.id !== req.params.id);
  if (data.templates.length === before) return res.status(404).json({ error: 'Шаблон не найден' });
  setUserData(req.user.id, data);
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// DAY DATA
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/daydata/:date', requireAuth, (req, res) => {
  if (!validateDate(req.params.date)) return badRequest(res, 'Неверный формат даты');
  const data = getUserData(req.user.id);
  const dd = data.dayData?.[req.params.date] || { bd: {}, td: {}, bc: {}, tc: {}, ts: {} };
  res.json({ date: req.params.date, ...dd });
});

app.post('/api/daydata/:date', requireAuth, (req, res) => {
  if (!validateDate(req.params.date)) return badRequest(res, 'Неверный формат даты');
  const { bd, td, bc, tc, ts } = req.body;
  const data = getUserData(req.user.id);
  if (!data.dayData) data.dayData = {};
  data.dayData[req.params.date] = { bd: bd||{}, td: td||{}, bc: bc||{}, tc: tc||{}, ts: ts||{} };
  setUserData(req.user.id, data);
  res.json({ ok: true });
});

app.patch('/api/daydata/:date/block/:blockId/done', requireAuth, (req, res) => {
  if (!validateDate(req.params.date)) return badRequest(res, 'Неверный формат даты');
  const { done, tasksDone } = req.body;
  if (typeof done !== 'boolean') return badRequest(res, 'done должен быть boolean');
  const data = getUserData(req.user.id);
  if (!data.dayData) data.dayData = {};
  if (!data.dayData[req.params.date]) data.dayData[req.params.date] = { bd: {}, td: {}, bc: {}, tc: {}, ts: {} };
  const dd = data.dayData[req.params.date];
  dd.bd[req.params.blockId] = done;
  if (tasksDone && typeof tasksDone === 'object') Object.assign(dd.td, tasksDone);
  setUserData(req.user.id, data);
  res.json({ ok: true, blockId: req.params.blockId, done });
});

app.patch('/api/daydata/:date/task/:taskId/done', requireAuth, (req, res) => {
  if (!validateDate(req.params.date)) return badRequest(res, 'Неверный формат даты');
  const { done, blockId, blockDone } = req.body;
  if (typeof done !== 'boolean') return badRequest(res, 'done должен быть boolean');
  const data = getUserData(req.user.id);
  if (!data.dayData) data.dayData = {};
  if (!data.dayData[req.params.date]) data.dayData[req.params.date] = { bd: {}, td: {}, bc: {}, tc: {}, ts: {} };
  const dd = data.dayData[req.params.date];
  dd.td[req.params.taskId] = done;
  if (blockId !== undefined) dd.bd[blockId] = !!blockDone;
  setUserData(req.user.id, data);
  res.json({ ok: true, taskId: req.params.taskId, done });
});

app.patch('/api/daydata/:date/block/:blockId/comment', requireAuth, (req, res) => {
  if (!validateDate(req.params.date)) return badRequest(res, 'Неверный формат даты');
  const { comment } = req.body;
  if (typeof comment !== 'string') return badRequest(res, 'comment должен быть строкой');
  const data = getUserData(req.user.id);
  if (!data.dayData) data.dayData = {};
  if (!data.dayData[req.params.date]) data.dayData[req.params.date] = { bd: {}, td: {}, bc: {}, tc: {}, ts: {} };
  data.dayData[req.params.date].bc[req.params.blockId] = comment;
  setUserData(req.user.id, data);
  res.json({ ok: true });
});

app.patch('/api/daydata/:date/task/:taskId/comment', requireAuth, (req, res) => {
  if (!validateDate(req.params.date)) return badRequest(res, 'Неверный формат даты');
  const { comment } = req.body;
  if (typeof comment !== 'string') return badRequest(res, 'comment должен быть строкой');
  const data = getUserData(req.user.id);
  if (!data.dayData) data.dayData = {};
  if (!data.dayData[req.params.date]) data.dayData[req.params.date] = { bd: {}, td: {}, bc: {}, tc: {}, ts: {} };
  data.dayData[req.params.date].tc[req.params.taskId] = comment;
  setUserData(req.user.id, data);
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// CALENDAR TAB
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/calendar/:year/:month', requireAuth, (req, res) => {
  const year = parseInt(req.params.year);
  const month = parseInt(req.params.month);
  if (isNaN(year) || isNaN(month) || month < 0 || month > 11) return badRequest(res, 'Неверный год или месяц');
  const data = getUserData(req.user.id);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let d = 1; d <= totalDays; d++) {
    const key = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const sched = data.schedules?.[key];
    const dd = data.dayData?.[key];
    let pct = 0, done = 0, total = 0;
    if (sched) {
      const main = sched.filter(b => !b.isBreak);
      total = main.length;
      done = main.filter(b => dd?.bd?.[b.id]).length;
      pct = total ? Math.round(done / total * 100) : 0;
    }
    days.push({ date: key, day: d, pct, done, total, hasData: !!sched });
  }
  res.json({ year, month, days });
});

// ══════════════════════════════════════════════════════════════════════════════
// KANBAN TAB
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/kanban/cols', requireAuth, (req, res) => {
  res.json({ cols: getUserData(req.user.id).kanbanCols || [] });
});

app.post('/api/kanban/cols', requireAuth, (req, res) => {
  const { id, title, color } = req.body;
  if (!title || typeof title !== 'string') return badRequest(res, 'title обязателен');
  const data = getUserData(req.user.id);
  if (!data.kanbanCols) data.kanbanCols = [];
  const col = { id: id || 'kc' + Date.now(), title: title.trim(), color: color || '#7c6ff7' };
  data.kanbanCols.push(col);
  setUserData(req.user.id, data);
  res.json({ ok: true, col });
});

app.put('/api/kanban/cols/:id', requireAuth, (req, res) => {
  const data = getUserData(req.user.id);
  const col = (data.kanbanCols || []).find(c => c.id === req.params.id);
  if (!col) return res.status(404).json({ error: 'Колонка не найдена' });
  const { title, color } = req.body;
  if (title !== undefined) col.title = String(title).trim();
  if (color !== undefined) col.color = String(color);
  setUserData(req.user.id, data);
  res.json({ ok: true, col });
});

app.delete('/api/kanban/cols/:id', requireAuth, (req, res) => {
  const data = getUserData(req.user.id);
  const before = data.kanbanCols?.length || 0;
  data.kanbanCols = (data.kanbanCols || []).filter(c => c.id !== req.params.id);
  data.kanbanCards = (data.kanbanCards || []).filter(c => c.colId !== req.params.id);
  if (data.kanbanCols.length === before) return res.status(404).json({ error: 'Колонка не найдена' });
  setUserData(req.user.id, data);
  res.json({ ok: true });
});

app.get('/api/kanban/cards', requireAuth, (req, res) => {
  let cards = getUserData(req.user.id).kanbanCards || [];
  if (req.query.date) cards = cards.filter(c => c.dateKey === req.query.date || !c.dateKey);
  if (req.query.colId) cards = cards.filter(c => c.colId === req.query.colId);
  res.json({ cards });
});

app.post('/api/kanban/cards', requireAuth, (req, res) => {
  const { id, title, tag, colId, comment, sourceTaskId, dateKey, overdue } = req.body;
  if (!title || typeof title !== 'string') return badRequest(res, 'title обязателен');
  if (!colId || typeof colId !== 'string') return badRequest(res, 'colId обязателен');
  const data = getUserData(req.user.id);
  if (!data.kanbanCards) data.kanbanCards = [];
  const card = { id: id || 'kc' + Date.now(), title: title.trim(), tag: tag || '', colId, comment: comment || '', sourceTaskId, dateKey, overdue: overdue || false };
  data.kanbanCards.push(card);
  setUserData(req.user.id, data);
  res.json({ ok: true, card });
});

app.put('/api/kanban/cards/:id', requireAuth, (req, res) => {
  const data = getUserData(req.user.id);
  const card = (data.kanbanCards || []).find(c => c.id === req.params.id);
  if (!card) return res.status(404).json({ error: 'Карточка не найдена' });
  ['title', 'tag', 'colId', 'comment', 'dateKey', 'overdue', 'prevDate'].forEach(f => {
    if (req.body[f] !== undefined) card[f] = req.body[f];
  });
  setUserData(req.user.id, data);
  res.json({ ok: true, card });
});

app.delete('/api/kanban/cards/:id', requireAuth, (req, res) => {
  const data = getUserData(req.user.id);
  const before = data.kanbanCards?.length || 0;
  data.kanbanCards = (data.kanbanCards || []).filter(c => c.id !== req.params.id);
  if (data.kanbanCards.length === before) return res.status(404).json({ error: 'Карточка не найдена' });
  setUserData(req.user.id, data);
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// ANALYTICS TAB
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/analytics', requireAuth, (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 365);
  const data = getUserData(req.user.id);
  let tBlocks = 0, dBlocks = 0, tTasks = 0, dTasks = 0, studyDays = 0, curStr = 0, maxStr = 0;
  const topicTime = { QA: 0, SQL: 0, English: 0, Anki: 0 };
  const daily = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const sched = data.schedules?.[key];
    const dd = data.dayData?.[key];
    if (!sched) { daily.push({ date: key, pct: 0, done: 0, total: 0 }); curStr = 0; continue; }
    const main = sched.filter(b => !b.isBreak);
    const done = main.filter(b => dd?.bd?.[b.id]).length;
    const tasks = sched.flatMap(b => b.tasks || []);
    const dtasks = tasks.filter(t => dd?.td?.[t.id]).length;
    tBlocks += main.length; dBlocks += done; tTasks += tasks.length; dTasks += dtasks;
    const pct = main.length ? Math.round(done / main.length * 100) : 0;
    if (pct > 0) { studyDays++; curStr++; } else curStr = 0;
    maxStr = Math.max(maxStr, curStr);
    daily.push({ date: key, pct, done, total: main.length });
    main.forEach(b => {
      if (!dd?.bd?.[b.id]) return;
      const t = b.title.toLowerCase();
      if (t.includes('qa') || t.includes('bible')) topicTime.QA += b.dur;
      else if (t.includes('sql')) topicTime.SQL += b.dur;
      else if (t.includes('english') || t.includes('англ')) topicTime.English += b.dur;
      else if (t.includes('anki')) topicTime.Anki += b.dur;
    });
  }
  res.json({
    days, totalBlocks: tBlocks, doneBlocks: dBlocks, totalTasks: tTasks, doneTasks: dTasks,
    studyDays, currentStreak: curStr, maxStreak: maxStr,
    pct: tBlocks ? Math.round(dBlocks / tBlocks * 100) : 0,
    avgBlocksPerDay: studyDays ? Math.round(dBlocks / studyDays * 10) / 10 : 0,
    topicTime, daily,
  });
});

// ── GOALS ─────────────────────────────────────────────────────────────────────

app.get('/api/goals', requireAuth, (req, res) => {
  const data = getUserData(req.user.id);
  res.json({ goals: data.goals || {} });
});

app.post('/api/goals', requireAuth, (req, res) => {
  const { goals } = req.body;
  if (!goals || typeof goals !== 'object') return badRequest(res, 'goals должен быть объектом');
  const data = getUserData(req.user.id);
  data.goals = goals;
  setUserData(req.user.id, data);
  res.json({ ok: true });
});

// ── TELEGRAM ──────────────────────────────────────────────────────────────────

app.post('/telegram/code', requireAuth, (req, res) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const db = readDB();
  if (!db.telegramCodes) db.telegramCodes = {};
  db.telegramCodes[req.user.id] = { code, expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() };
  writeDB(db);
  res.json({ code });
});

app.get('/telegram/status', requireAuth, (req, res) => {
  const db = readDB();
  res.json({ linked: !!(db.telegramLinks || {})[req.user.id] });
});

app.post('/telegram/unlink', requireAuth, (req, res) => {
  const db = readDB();
  if (!db.telegramLinks) db.telegramLinks = {};
  delete db.telegramLinks[req.user.id];
  writeDB(db);
  res.json({ ok: true });
});

// ── EXPORTS (для bot.js) ──────────────────────────────────────────────────────

function getUserByChatId(chatId) {
  const db = readDB();
  const entry = Object.entries(db.telegramLinks || {}).find(([, cid]) => cid === String(chatId));
  if (!entry) return null;
  return (db.users || []).find(u => u.id === entry[0]) || null;
}

function linkTelegramByCode(code, chatId) {
  const db = readDB();
  const entry = Object.entries(db.telegramCodes || {}).find(([, v]) => v.code === code);
  if (!entry) return { ok: false, error: 'Неверный код' };
  const [userId, codeData] = entry;
  if (new Date(codeData.expiresAt) < new Date()) return { ok: false, error: 'Код истёк. Запроси новый в приложении.' };
  if (!db.telegramLinks) db.telegramLinks = {};
  db.telegramLinks[userId] = String(chatId);
  delete db.telegramCodes[userId];
  writeDB(db);
  const user = (db.users || []).find(u => u.id === userId);
  return { ok: true, user };
}

function getAllLinkedUsers() {
  const db = readDB();
  return Object.entries(db.telegramLinks || {}).map(([userId, chatId]) => ({ user_id: userId, chat_id: chatId }));
}

module.exports = { readDB, writeDB, getUserByChatId, getUserData, linkTelegramByCode, getAllLinkedUsers };

// ── START ─────────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀 StudyFlow сервер: http://localhost:${PORT}`);
    console.log(`📱 Приложение: http://localhost:${PORT}/study-tracker_2.html`);
    console.log(`\n📋 REST API: /api/schedule, /api/daydata, /api/calendar, /api/kanban, /api/analytics, /api/templates, /api/goals`);
    console.log(`🔒 Rate limiting: /auth/email → 5 req/15min | /api/* → 120 req/min`);
    console.log(`🤖 Telegram бот: запусти → node bot.js\n`);
    if (!process.env.SMTP_USER) console.log('⚠️  SMTP не настроен — magic link будет печататься в консоль (dev mode)\n');
  });
}
