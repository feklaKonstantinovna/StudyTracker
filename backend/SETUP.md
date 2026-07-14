# StudyFlow Backend — Инструкция по запуску

## 1. Установи Node.js

Открой Terminal и выполни:

```bash
# Установи Homebrew (если нет)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Установи Node.js
brew install node
```

Проверь что установилось:
```bash
node --version   # должно быть v18+
npm --version
```

---

## 2. Настрой .env

```bash
cd ~/Desktop/StudyTracker/backend
cp .env.example .env
```

Открой `.env` и заполни:

### Email (Gmail)
1. Войди в Google аккаунт → Безопасность → Двухэтапная верификация (включи)
2. Затем: Пароли приложений → создай пароль для "Другое" → скопируй 16-значный пароль
3. Вставь в .env:
   ```
   SMTP_USER=твой@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   ```

### Telegram Bot
1. Открой Telegram → найди @BotFather
2. Отправь `/newbot`
3. Придумай имя и username (например `StudyFlowMyBot`)
4. Скопируй токен и вставь в .env:
   ```
   TELEGRAM_BOT_TOKEN=1234567890:AAbbccddee...
   ```

---

## 3. Установи зависимости

```bash
cd ~/Desktop/StudyTracker/backend
npm install
```

---

## 4. Запусти сервер

```bash
# В одном терминале — сервер (авторизация + синхронизация данных):
node server.js

# В другом терминале — Telegram бот:
node bot.js
```

---

## 5. Открой приложение

Вместо открытия HTML-файла напрямую — открой через сервер:

```
http://localhost:3001/study-tracker_2.html
```

Так авторизация через email будет работать (magic link ведёт на этот адрес).

---

## Как работает авторизация

1. Нажми "✉️ Email" в баннере приложения
2. Введи свой email
3. Проверь почту → нажми ссылку "Войти в StudyFlow"
4. Автоматически перенаправит в приложение и войдёт

## Как привязать Telegram

1. Войди в приложение по email
2. Нажми кнопку "🤖 Telegram" в баннере
3. Получишь 6-значный код
4. Открой своего бота в Telegram
5. Отправь: `/link 123456`
6. Готово! Бот будет присылать:
   - ☀️ Утренние напоминания (9:00 МСК)
   - 📊 Вечерние отчёты о прогрессе (21:00 МСК)

## Команды бота

| Команда | Что делает |
|---------|-----------|
| `/start` | Инструкция |
| `/link <код>` | Привязать аккаунт |
| `/stats` | Прогресс сегодня |
| `/week` | Статистика за 7 дней |
| `/unlink` | Отвязать аккаунт |
