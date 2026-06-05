/**
 * Минимальный smoke / E2E прогон на Puppeteer.
 * Поднимает `astro preview` над собранным `dist`, открывает ключевые
 * страницы и проверяет критичные сценарии: рендер, тёмная тема, модалка
 * заявки с валидацией, интерактивный степпер демо.
 *
 * Запуск: npm test  (сначала собирает сайт, см. package.json)
 */
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer';

const PORT = 4321;
const BASE = `http://localhost:${PORT}`;

const failures = [];
function check(name, condition) {
  if (condition) {
    console.log(`  ✓ ${name}`);
  } else {
    console.error(`  ✗ ${name}`);
    failures.push(name);
  }
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* ещё не поднялся */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Сервер не поднялся за ${timeoutMs} мс: ${url}`);
}

const server = spawn('npm', ['run', 'preview', '--', '--port', String(PORT)], {
  stdio: 'ignore',
});

let browser;
try {
  await waitForServer(BASE);
  browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // --- Главная ---
  console.log('Главная страница:');
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  check('заголовок содержит Formit', (await page.title()).includes('Formit'));
  check('хедер отрисован', !!(await page.$('[data-site-header]')));
  check('секция hero есть', !!(await page.$('#hero')));

  // Тёмная тема
  const before = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.click('[data-theme-toggle]');
  const after = await page.evaluate(() => document.documentElement.dataset.theme);
  check('переключатель темы меняет data-theme', before !== after);

  // Модалка заявки + валидация пустой формы.
  // Клик через DOM, чтобы не зависеть от перекрытий/вьюпорта (Preact слушает click).
  await page.waitForSelector('.header__actions .form-btn');
  await page.evaluate(() => document.querySelector('.header__actions .form-btn')?.click());
  await page.waitForSelector('.modal', { timeout: 5000 });
  check('модалка заявки открывается', !!(await page.$('.modal')));
  const modalBox = await page.$eval('.modal', (el) => {
    const rect = el.getBoundingClientRect();
    return {
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      viewportW: window.innerWidth,
      viewportH: window.innerHeight,
    };
  });
  check(
    'модалка заявки центрируется во viewport',
    Math.abs(modalBox.centerX - modalBox.viewportW / 2) < 80 &&
      Math.abs(modalBox.centerY - modalBox.viewportH / 2) < 120
  );
  check(
    'открытая модалка помечает body',
    await page.evaluate(() => document.body.classList.contains('formit-modal-open'))
  );
  await page.evaluate(() => document.querySelector('.modal__submit')?.click());
  await page.waitForSelector('.field__error', { timeout: 3000 }).catch(() => {});
  check('валидация показывает ошибки полей', !!(await page.$('.field__error')));

  // --- Демо ---
  console.log('Демо-страница:');
  await page.goto(`${BASE}/demo`, { waitUntil: 'networkidle0' });
  check('кнопка Демо скрыта в хедере демо-страницы', !(await page.$('.header__demo')));
  const headerActions = await page.$eval('.header__actions', (el) => {
    const rect = el.getBoundingClientRect();
    return { right: rect.right, viewportW: window.innerWidth };
  });
  check('действия хедера на демо-странице выровнены вправо', headerActions.viewportW - headerActions.right < 80);
  check('степпер демо присутствует', !!(await page.$('[data-demo-steps]')));
  const steps = await page.$$('[data-step-index]');
  check('четыре шага демо', steps.length === 4);
  check('карточки демо без декоративных номеров', !(await page.$('.demo-step__num')));
  if (steps.length > 1) {
    await page.evaluate(() => document.querySelector('[data-step-index="2"]')?.click());
    const selected = await page.evaluate(() =>
      document.querySelector('[data-step-index="2"]')?.getAttribute('aria-selected')
    );
    check('клик по шагу выделяет его', selected === 'true');
  }

  // --- 404 ---
  console.log('Страница 404:');
  const res404 = await page.goto(`${BASE}/nope-${Date.now()}`, { waitUntil: 'networkidle0' });
  check('404 отдаёт страницу', res404 !== null);
} catch (err) {
  console.error('Ошибка прогона:', err.message);
  failures.push('runtime: ' + err.message);
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}

if (failures.length) {
  console.error(`\n✗ Провалено проверок: ${failures.length}`);
  process.exit(1);
}
console.log('\n✓ Все smoke-проверки пройдены');
process.exit(0);
