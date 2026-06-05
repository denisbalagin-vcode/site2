/** Данные формы заявки. */
export interface LeadInput {
  name: string;
  email: string;
  comment?: string;
}

/** Карта ошибок по полям. Пустой объект — данные валидны. */
export type LeadErrors = Partial<Record<'name' | 'email', string>>;

// Достаточно строгая, но не агрессивная проверка email.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLead(input: LeadInput): LeadErrors {
  const errors: LeadErrors = {};

  if (!input.name.trim()) {
    errors.name = 'Укажите имя';
  }

  const email = input.email.trim();
  if (!email) {
    errors.email = 'Укажите email';
  } else if (!EMAIL_RE.test(email)) {
    errors.email = 'Проверьте формат email';
  }

  return errors;
}

export function isValidLead(input: LeadInput): boolean {
  return Object.keys(validateLead(input)).length === 0;
}
