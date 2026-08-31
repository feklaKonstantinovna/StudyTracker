# Промпт на фикс багов StudyFlow

Ты правишь репозиторий https://github.com/feklaKonstantinovna/StudyTracker (ветка `main`).
Не меняй модель данных `sfv3` и не ломай существующие `data-testid`.
Автотесты лежат в `autotests_ui/e2e`. Команда: `npx playwright test`.
Цель — сделать красные тесты зелёными без ослабления ассертов.

## Подтверждённые баги

### 1. `dk()` считает дату по UTC
Файл: `src/utils/dateUtils.js`.
Сейчас: `d.toISOString().split('T')[0]`.
В `Europe/Moscow` `new Date(2026, 0, 1, 0, 30, 0)` даёт ключ `2025-12-31`.

Исправление: ключ из `getFullYear()`, `getMonth()+1`, `getDate()` с pad.
Проверка: `autotests_ui/e2e/utils.spec.js`.

### 2. Мобильная вёрстка 390px — сайдбар не уезжает
Гамбургер есть, но закрытый `.sidebar` всё ещё в кадре (`x+width ≈ 121`).
`main-content.x < 40`, закрытый сайдбар `x+width < 40`.
Проверка: `autotests_ui/e2e/mobile.spec.js`.

### 3. «＋ Добавить» задачу не открывает `#taskModal`
Создать блок → раскрыть → клик `btn-add-task-{id}`.
`#taskModal` должен получить класс `show`.
Проверка: `autotests_ui/e2e/schedule.spec.js`.

## Как проверить
```bash
npx playwright test
```
Не удаляй тесты и не меняй `timezoneId: Europe/Moscow`.
