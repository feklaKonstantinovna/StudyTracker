const crypto  = require('crypto');
const jwt     = require('jsonwebtoken');
const config  = require('../config');
const { addMinutes, addDays, isExpired } = require('../utils/dateUtils');

const userRepo = require('../repositories/UserRepository');
const authRepo = require('../repositories/AuthRepository');

class AuthService {
  generateMagicToken(email, baseUrl) {
    const user  = userRepo.findOrCreate(email);
    const token = crypto.randomBytes(32).toString('hex');
    authRepo.saveAuthToken(token, user.id, addMinutes(config.TOKEN_TTL.authMinutes));
    const link = `${baseUrl}/auth/verify?token=${token}`;
    return { user, token, link };
  }

  verifyMagicToken(token) {
    const row = authRepo.findAuthToken(token);
    if (!row)                    return { ok: false, error: 'Ссылка недействительна или уже использована.' };
    if (isExpired(row.expiresAt)) return { ok: false, error: 'Ссылка истекла. Запроси новую.' };

    authRepo.markAuthTokenUsed(token);

    const user         = userRepo.findById(row.userId);
    const accessToken  = this._signAccess(user);
    const refreshToken = this._createRefresh(user.id);

    return { ok: true, user, accessToken, refreshToken };
  }

  refreshAccess(refreshToken) {
    const row = authRepo.findRefreshToken(refreshToken);
    if (!row)                    return { ok: false, error: 'Refresh token не найден или истёк' };
    if (isExpired(row.expiresAt)) {
      authRepo.deleteRefreshToken(refreshToken);
      return { ok: false, error: 'Refresh token истёк. Войди снова.' };
    }
    const user = userRepo.findById(row.userId);
    if (!user) return { ok: false, error: 'Пользователь не найден' };
    return { ok: true, accessToken: this._signAccess(user), email: user.email };
  }

  revokeRefresh(refreshToken) {
    if (refreshToken) authRepo.deleteRefreshToken(refreshToken);
  }

  verifyAccessToken(token) {
    return jwt.verify(token, config.JWT_SECRET);
  }

  _signAccess(user) {
    return jwt.sign({ id: user.id, email: user.email }, config.JWT_SECRET, { expiresIn: '1h' });
  }

  _createRefresh(userId) {
    const token = crypto.randomBytes(40).toString('hex');
    authRepo.saveRefreshToken(token, userId, addDays(config.TOKEN_TTL.refreshDays));
    return token;
  }
}

module.exports = new AuthService();
