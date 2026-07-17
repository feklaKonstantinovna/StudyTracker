const crypto       = require('crypto');
const { addMinutes, isExpired } = require('../utils/dateUtils');
const telegramRepo = require('../repositories/TelegramRepository');
const userRepo     = require('../repositories/UserRepository');
const userDataRepo = require('../repositories/UserDataRepository');

class TelegramService {
  generateCode(userId) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    telegramRepo.saveCode(userId, code, addMinutes(10));
    return code;
  }

  linkByCode(code, chatId) {
    const found = telegramRepo.findByCode(code);
    if (!found)                    return { ok: false, error: 'Неверный код' };
    if (isExpired(found.expiresAt)) return { ok: false, error: 'Код истёк. Запроси новый в приложении.' };

    telegramRepo.setLink(found.userId, chatId);
    telegramRepo.deleteCode(found.userId);

    const user = userRepo.findById(found.userId);
    return { ok: true, user };
  }

  isLinked(userId) {
    return !!telegramRepo.getLink(userId);
  }

  unlink(userId) {
    telegramRepo.deleteLink(userId);
  }

  getUserByChatId(chatId) {
    const userId = telegramRepo.findUserIdByChatId(chatId);
    return userId ? userRepo.findById(userId) : null;
  }

  getUserDataByChatId(chatId) {
    const userId = telegramRepo.findUserIdByChatId(chatId);
    return userId ? userDataRepo.get(userId) : null;
  }

  getAllLinkedUsers() {
    return telegramRepo.getAllLinks();
  }
}

module.exports = new TelegramService();
