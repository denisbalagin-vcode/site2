/**
 * Тонкая обёртка над аналитикой. По умолчанию — no-op: пока скрипт аналитики
 * не подключён (см. Layout.astro и `PUBLIC_PLAUSIBLE_DOMAIN`), вызовы `track`
 * ничего не делают и безопасны.
 *
 * Подключение в будущем: задать в `.env`
 *   PUBLIC_PLAUSIBLE_DOMAIN="formit.pro"
 *   PUBLIC_PLAUSIBLE_SRC="https://plausible.io/js/script.js"  // опционально
 * После этого события начнут уходить в Plausible (совместимо и с Umami,
 * у которого тоже есть глобальная функция-трекер).
 */

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
    umami?: { track: (event: string, props?: Record<string, unknown>) => void };
  }
}

/** Имена событий держим в одном месте, чтобы не плодить опечатки. */
export type AnalyticsEvent = 'open_form' | 'lead_submitted' | 'demo_click';

export function track(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    window.plausible?.(event, props ? { props } : undefined);
    window.umami?.track(event, props);
  } catch {
    /* аналитика не должна ронять UI */
  }
}
