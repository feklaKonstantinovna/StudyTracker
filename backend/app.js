const express       = require('express');
const cors          = require('cors');
const path          = require('path');
const { requireAuth }             = require('./middleware/authMiddleware');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');
const authRoutes     = require('./routes/authRoutes');
const apiRoutes      = require('./routes/apiRoutes');
const telegramRoutes = require('./routes/telegramRoutes');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..')));

app.use('/auth/email', authLimiter);
app.use('/api/',       apiLimiter);

app.use('/auth',     authRoutes);
app.use('/api',      requireAuth, apiRoutes);
app.use('/telegram', requireAuth, telegramRoutes);

// legacy bulk sync (without /api prefix)
const userDataRepo = require('./repositories/UserDataRepository');
app.get('/data',  requireAuth, (req, res) => {
  const entry = userDataRepo.getMeta(req.user.id);
  if (!entry) return res.json({ data: null });
  res.json({ data: entry.data, updated_at: entry.updatedAt });
});
app.post('/data', requireAuth, (req, res) => {
  const { data } = req.body;
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Нет данных' });
  userDataRepo.set(req.user.id, data);
  res.json({ ok: true, updated_at: new Date().toISOString() });
});

module.exports = app;
