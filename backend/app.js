const express       = require('express');
const cors          = require('cors');
const path          = require('path');
const { requireAuth }             = require('./middleware/authMiddleware');
const { requirePro }              = require('./middleware/requirePro');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');
const authRoutes     = require('./routes/authRoutes');
const apiRoutes      = require('./routes/apiRoutes');
const telegramRoutes = require('./routes/telegramRoutes');
const planCtrl       = require('./controllers/PlanController');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..')));

app.use('/auth/email', authLimiter);
app.use('/api/',       apiLimiter);

app.use('/auth',     authRoutes);
app.post('/api/funnel', apiLimiter, (req, res) => planCtrl.track(req, res));
app.use('/api',      requireAuth, requirePro, apiRoutes);
app.use('/telegram', requireAuth, requirePro, telegramRoutes);

const userDataRepo = require('./repositories/UserDataRepository');
app.get('/data',  requireAuth, requirePro, (req, res) => {
  const entry = userDataRepo.getMeta(req.user.id);
  if (!entry) return res.json({ data: null });
  res.json({ data: entry.data, updated_at: entry.updatedAt });
});
app.post('/data', requireAuth, requirePro, (req, res) => {
  const { data, updatedAt } = req.body;
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Нет данных' });
  const entry = userDataRepo.getMeta(req.user.id);
  if (entry?.updatedAt && updatedAt && new Date(updatedAt) < new Date(entry.updatedAt)) {
    return res.status(409).json({
      error: 'conflict',
      message: 'На сервере более свежие данные',
      server_updated_at: entry.updatedAt,
      data: entry.data,
    });
  }
  userDataRepo.set(req.user.id, data);
  res.json({ ok: true, updated_at: new Date().toISOString() });
});

module.exports = app;
