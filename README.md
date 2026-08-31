# StudyFlow

Трекер учёбы: расписание дня, цели, темы, календарь, аналитика. Данные по умолчанию в `localStorage` (`sfv3`).

## Как открыть

Самый простой путь — `study-tracker_2.html` через любой static-сервер или GitHub Pages.  
`index.html` ведёт сразу в трекер, логин не обязателен.

Backend нужен только для email-magic-link и Telegram.

```bash
cd backend
cp .env.example .env
npm install
node server.js
```

Приложение: http://localhost:3001/study-tracker_2.html

## Что хранится локально

Расписание, прогресс, цели, темы, канбан, шаблоны.  
Бэкап: сайдбар → «Бэкап JSON» / «Восстановить».

Облачной синхронизации на GitHub Pages нет.

## Тестовый логин

Подсказка на `login.html` видна только с `?qa=1` или на localhost.
