import type { LeadInput } from './validation';
import { email as companyEmail } from '../data/contacts';

/**
 * Отправка заявки.
 *
 * Абстракция над транспортом, чтобы подключение внешнего сервиса свелось
 * к установке одной переменной окружения — код компонентов не меняется.
 *
 * Поведение:
 *  - Если задан `PUBLIC_FORM_ENDPOINT` (например, Web3Forms/Formspree или
 *    своя serverless-функция) — отправляем POST JSON туда.
 *  - Иначе (по умолчанию сейчас) — открываем почтовый клиент через mailto.
 *
 * Чтобы включить реальную отправку в будущем, добавь в `.env`:
 *   PUBLIC_FORM_ENDPOINT="https://api.web3forms.com/submit"
 *   PUBLIC_FORM_ACCESS_KEY="<ключ доступа сервиса>"   // если требуется
 */

const endpoint = import.meta.env.PUBLIC_FORM_ENDPOINT as string | undefined;
const accessKey = import.meta.env.PUBLIC_FORM_ACCESS_KEY as string | undefined;

export type LeadResult = { ok: true; via: 'endpoint' | 'mailto' } | { ok: false; error: string };

function buildMailto({ name, email, comment }: LeadInput): string {
  const subject = `Заявка от ${name}`;
  const body = `Имя: ${name}\nКонтакт: ${email}\nКомментарий: ${comment ?? ''}`;
  return `mailto:${companyEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function submitLead(data: LeadInput): Promise<LeadResult> {
  // Реальная отправка на endpoint, когда он сконфигурирован.
  if (endpoint) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...(accessKey ? { access_key: accessKey } : {}),
          name: data.name,
          email: data.email,
          message: data.comment ?? '',
          subject: `Заявка от ${data.name}`,
          from_name: 'formit.pro',
        }),
      });

      if (!res.ok) {
        return { ok: false, error: `Сервер вернул ${res.status}` };
      }
      return { ok: true, via: 'endpoint' };
    } catch {
      return { ok: false, error: 'Не удалось отправить. Проверьте соединение.' };
    }
  }

  // Fallback по умолчанию: почтовый клиент.
  if (typeof window !== 'undefined') {
    window.location.href = buildMailto(data);
  }
  return { ok: true, via: 'mailto' };
}
