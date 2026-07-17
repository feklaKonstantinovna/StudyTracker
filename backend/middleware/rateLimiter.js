const rateLimit = require('express-rate-limit');
const config    = require('../config');

const authLimiter = rateLimit({
  ...config.RATE_LIMIT.auth,
  message:        { error: 'Слишком много запросов. Повтори через 15 минут.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

const apiLimiter = rateLimit({
  ...config.RATE_LIMIT.api,
  message:        { error: 'Слишком много запросов.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

module.exports = { authLimiter, apiLimiter };
