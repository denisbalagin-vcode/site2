/**
 * Единый источник правды для контактов и реквизитов компании.
 * Раньше эти значения были захардкожены в 6+ местах (Footer, Layout,
 * Contacts, Hero, FormSubmission, demo). Меняй контакты только здесь.
 */

export const email = 'info@formit.pro';

export const phones = [
  { label: '+7 (922) 125-18-85', tel: '89221251885' },
  { label: '+7 (343) 361-01-00', tel: '83433610100' },
] as const;

export const telegram = {
  handle: '@Tatiana_Formit',
  url: 'https://t.me/Tatiana_FormIT',
} as const;

export const address = {
  /** Готовая строка с неразрывными пробелами для вывода в разметке. */
  html: '620000, г.&nbsp;Екатеринбург, ул.&nbsp;Первомайская,&nbsp;15, офис&nbsp;802',
  /** Плоская строка для JSON-LD / атрибутов. */
  plain: '620000, г. Екатеринбург, ул. Первомайская, 15, офис 802',
  street: 'ул. Первомайская, 15, офис 802',
  locality: 'Екатеринбург',
  postalCode: '620000',
  country: 'RU',
  mapUrl: 'https://go.2gis.com/x0Qn5',
} as const;

/** Внешняя документация (docs.formit.pro). */
export const docs = {
  manual: 'https://docs.formit.pro/docs/manual/registration',
  guidelines: 'https://docs.formit.pro/docs/guidelines/possibilities',
  changelog: 'https://docs.formit.pro/docs/changelog/latest',
} as const;

/**
 * Веб-сервис продукта (личный кабинет).
 * Кнопка «Войти» ведёт сюда. Адрес можно переопределить переменной
 * окружения PUBLIC_ACCOUNT_URL (в духе остальных PUBLIC_* настроек).
 */
export const accountUrl =
  (import.meta.env.PUBLIC_ACCOUNT_URL as string | undefined) ?? 'https://account.formit.pro/';

export const mailtoEmail = `mailto:${email}`;
