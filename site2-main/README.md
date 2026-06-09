# Formit — сайт сервиса расчёта инсоляции и КЕО

Маркетинговый сайт [formit.pro](https://formit.pro) на **Astro** + **Preact**.
Статическая генерация, минимум клиентского JS, собственная система дизайн-токенов.

## 🧞 Команды

Запускаются из корня проекта:

| Команда                | Действие                                                   |
| :--------------------- | :--------------------------------------------------------- |
| `npm install`          | Установка зависимостей                                     |
| `npm run dev`          | Локальный dev-сервер на `localhost:4321`                   |
| `npm run build`        | Прод-сборка в `./dist/` (генерирует и `sitemap-index.xml`) |
| `npm run preview`      | Локальный предпросмотр собранного сайта                    |
| `npm run format`       | Форматирование Prettier                                    |
| `npm run format:check` | Проверка форматирования                                    |
| `npm test`             | Сборка + smoke/E2E прогон на Puppeteer (`tests/smoke.mjs`) |

## 📁 Структура

```text
src/
├── pages/         # Маршруты (index, demo, 404)
├── layouts/       # Базовый Layout (head, SEO, тема, аналитика)
├── components/    # Header, Footer, секции (sections/) и UI (ui/)
├── data/          # contacts.ts — единый источник контактов/реквизитов
├── utils/         # asset, validation, leads (форма), analytics
└── styles/        # tokens.css (дизайн-токены), global.css, fonts.css
```

## 🎨 Темизация

- Все цвета/отступы/шрифты — в `src/styles/tokens.css`. Редизайн начинай отсюда.
- Поддержаны светлая и тёмная темы. Inline-скрипт в `Layout.astro` выставляет
  `data-theme` до отрисовки (без мигания), приоритет — у сохранённого выбора,
  иначе системная тема. Переключатель — в шапке.

## 🔌 Подключение внешних сервисов (опционально)

Сайт работает без внешних интеграций. Чтобы их включить, заполни `.env`
(см. `.env.example`):

- **Форма заявок** (`src/utils/leads.ts`): задай `PUBLIC_FORM_ENDPOINT`
  (Web3Forms/Formspree/своя функция) и при необходимости `PUBLIC_FORM_ACCESS_KEY`.
  Без них форма открывает почтовый клиент через `mailto`.
- **Аналитика** (`src/utils/analytics.ts`): задай `PUBLIC_PLAUSIBLE_DOMAIN`
  (и опц. `PUBLIC_PLAUSIBLE_SRC`). Без них трекинг — no-op. События:
  `open_form`, `lead_submitted`, `demo_click`.

## 🚀 Деплой

GitHub Actions (`.github/workflows/deploy.yml`) собирает и публикует на GitHub
Pages при пуше в `main`. Прод-домен — `formit.pro`.
