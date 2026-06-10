import { useState, useEffect, useCallback } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { validateLead, type LeadErrors } from '../utils/validation';
import { submitLead } from '../utils/leads';
import { track } from '../utils/analytics';

interface Props {
  buttonText?: string;
  buttonClass?: string;
  variant?: 'filled' | 'outlined';
  size?: 'small' | 'normal';
}

export default function FormSubmission({
  buttonText = 'Оставить заявку',
  buttonClass = '',
  variant = 'filled',
  size = 'normal',
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [comment, setComment] = useState('');
  // honeypot — скрытое поле-ловушка для ботов; человек его не заполняет
  const [trap, setTrap] = useState('');
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [errors, setErrors] = useState<LeadErrors>({});
  const [errorMsg, setErrorMsg] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'sending' | 'success' | 'error'
  >('idle');

  const close = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      setStatus('idle');
      setErrors({});
      setErrorMsg('');
    }, 300);
  }, []);

  const openModal = useCallback(() => {
    setOpen(true);
    track('open_form');
  }, []);

  useEffect(() => {
    let root = document.getElementById('formit-modal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'formit-modal-root';
      document.body.appendChild(root);
    }
    setPortalRoot(root);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && close();
    const previousOverflow = document.body.style.overflow;
    document.addEventListener('keydown', handler);
    document.body.classList.add('formit-modal-open');
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.classList.remove('formit-modal-open');
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  const submit = async (e: Event) => {
    e.preventDefault();

    // Бот заполнил ловушку — делаем вид, что всё хорошо, ничего не отправляя.
    if (trap) {
      setStatus('success');
      return;
    }

    const fieldErrors = validateLead({ name, email: contact });
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setErrorMsg('');
    setStatus('sending');

    const result = await submitLead({ name, email: contact, comment });
    if (result.ok) {
      track('lead_submitted', { via: result.via });
      setStatus('success');
    } else {
      setErrorMsg(result.error);
      setStatus('error');
    }
  };

  const btnCls = [
    'form-btn',
    `form-btn--${variant}`,
    `form-btn--${size}`,
    buttonClass,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <button type="button" class={btnCls} onClick={openModal}>
        {buttonText}
      </button>

      {/* Модалка рендерится в <body> через портал: иначе backdrop-filter
          на шапке создаёт containing block для position:fixed и оверлей
          обрезается по высоте шапки. */}
      {open &&
        portalRoot &&
        createPortal(
          <div
            class="modal-overlay"
            onClick={(e) => e.target === e.currentTarget && close()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-modal-title"
          >
            <div class="modal">
              <button
                type="button"
                class="modal__close"
                onClick={close}
                aria-label="Закрыть"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M4 4L14 14M14 4L4 14"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                  />
                </svg>
              </button>

              {status === 'success' ? (
                <div class="modal__success">
                  <div class="modal__success-icon">✓</div>
                  <h3 class="modal__title">Заявка отправлена!</h3>
                  <p class="modal__subtitle">
                    Мы свяжемся с вами в ближайшее время.
                  </p>
                  <button
                    type="button"
                    class="form-btn form-btn--filled form-btn--normal"
                    onClick={close}
                  >
                    Закрыть
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <h3 id="form-modal-title" class="modal__title">
                    Оставить заявку
                  </h3>
                  <p class="modal__subtitle">
                    Заполните форму — мы свяжемся с вами и подберём оптимальный
                    тариф.
                  </p>

                  <div class="modal__fields">
                    <label class="field">
                      <span class="field__label">
                        Имя <span aria-hidden="true">*</span>
                      </span>
                      <input
                        class={`field__input${errors.name ? ' field__input--invalid' : ''}`}
                        type="text"
                        placeholder="Иван Иванов"
                        required
                        value={name}
                        aria-invalid={errors.name ? 'true' : undefined}
                        aria-describedby={
                          errors.name ? 'field-name-error' : undefined
                        }
                        onInput={(e) => {
                          setName((e.target as HTMLInputElement).value);
                          if (errors.name)
                            setErrors((p) => ({ ...p, name: undefined }));
                        }}
                      />
                      {errors.name && (
                        <span id="field-name-error" class="field__error">
                          {errors.name}
                        </span>
                      )}
                    </label>

                    <label class="field">
                      <span class="field__label">
                        Email <span aria-hidden="true">*</span>
                      </span>
                      <input
                        class={`field__input${errors.email ? ' field__input--invalid' : ''}`}
                        type="email"
                        placeholder="ivan@example.com"
                        required
                        value={contact}
                        aria-invalid={errors.email ? 'true' : undefined}
                        aria-describedby={
                          errors.email ? 'field-email-error' : undefined
                        }
                        onInput={(e) => {
                          setContact((e.target as HTMLInputElement).value);
                          if (errors.email)
                            setErrors((p) => ({ ...p, email: undefined }));
                        }}
                      />
                      {errors.email && (
                        <span id="field-email-error" class="field__error">
                          {errors.email}
                        </span>
                      )}
                    </label>

                    <label class="field">
                      <span class="field__label">Комментарий</span>
                      <textarea
                        class="field__input field__input--textarea"
                        placeholder="Расскажите о вашем проекте..."
                        rows={3}
                        value={comment}
                        onInput={(e) =>
                          setComment((e.target as HTMLTextAreaElement).value)
                        }
                      />
                    </label>

                    {/* honeypot: скрыт от людей, доступен ботам */}
                    <input
                      class="field__trap"
                      type="text"
                      name="company"
                      tabIndex={-1}
                      autocomplete="off"
                      aria-hidden="true"
                      value={trap}
                      onInput={(e) =>
                        setTrap((e.target as HTMLInputElement).value)
                      }
                    />
                  </div>

                  {status === 'error' && (
                    <p class="modal__error" role="alert">
                      {errorMsg || 'Что-то пошло не так. Попробуйте ещё раз.'}
                    </p>
                  )}

                  <div class="modal__actions">
                    <button
                      type="submit"
                      class={`form-btn form-btn--filled form-btn--normal modal__submit${status === 'sending' ? ' is-loading' : ''}`}
                      disabled={status === 'sending'}
                    >
                      {status === 'sending'
                        ? 'Отправка...'
                        : status === 'error'
                          ? 'Попробовать снова'
                          : 'Отправить заявку'}
                    </button>
                    <p class="modal__privacy">
                      Нажимая кнопку, вы соглашаетесь с обработкой персональных
                      данных
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>,
          portalRoot,
        )}

      <style>{`
        .form-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-family: inherit;
          font-weight: var(--font-weight-semibold, 600);
          border-radius: var(--radius-full, 9999px);
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: background 0.15s, color 0.15s, border-color 0.15s, opacity 0.15s, transform 0.1s;
          white-space: nowrap;
        }
        .form-btn--small { font-size: var(--font-size-sm, 0.875rem); padding: 0.5rem 1.125rem; }
        .form-btn--normal { font-size: var(--font-size-base, 1rem); padding: 0.75rem 1.75rem; }
        .form-btn--filled {
          background: var(--gradient-primary, var(--color-accent-primary, #0047ff));
          color: #fff;
          border-color: transparent;
        }
        .form-btn--filled:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px color-mix(in srgb, var(--color-accent-primary, #0047ff) 50%, transparent);
        }
        .form-btn:focus-visible {
          outline: 2px solid var(--color-accent-primary, #0047ff);
          outline-offset: 3px;
        }
        .form-btn--outlined {
          background: transparent;
          color: var(--color-text-primary, #0f1117);
          border-color: var(--color-border, #e2e8f0);
        }
        .form-btn--outlined:hover:not(:disabled) {
          background: var(--color-accent-primary, #0047ff);
          color: #fff;
          border-color: var(--color-accent-primary, #0047ff);
        }
        .form-btn:active:not(:disabled) { transform: translateY(1px); }
        .form-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9000;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: grid;
          place-items: center;
          padding: 1rem;
          overflow-y: auto;
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .modal {
          position: relative;
          width: 100%;
          max-width: 480px;
          background: var(--color-bg-primary, #fff);
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: var(--radius-xl, 1.25rem);
          box-shadow: var(--shadow-xl, 0 20px 60px rgba(0,0,0,0.15));
          padding: 2rem;
          max-height: calc(100dvh - 2rem);
          overflow-y: auto;
          animation: slideUp 0.2s ease;
        }
        @keyframes slideUp { from { transform: translateY(12px); opacity:0; } to { transform: translateY(0); opacity:1; } }

        .modal__close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md, 0.5rem);
          color: var(--color-text-secondary, #64748b);
          transition: background 0.15s, color 0.15s;
        }
        .modal__close:hover { background: var(--color-bg-secondary, #f8fafc); color: var(--color-text-primary, #0f1117); }

        .modal__title {
          font-size: var(--font-size-xl, 1.25rem);
          font-weight: var(--font-weight-bold, 700);
          color: var(--color-text-primary, #0f1117);
          margin-bottom: 0.5rem;
        }
        .modal__subtitle {
          font-size: var(--font-size-sm, 0.875rem);
          color: var(--color-text-secondary, #64748b);
          line-height: 1.5;
          margin-bottom: 1.5rem;
        }

        .modal__fields { display: flex; flex-direction: column; gap: 1rem; }

        .field { display: flex; flex-direction: column; gap: 0.375rem; }
        .field__label { font-size: var(--font-size-sm, 0.875rem); font-weight: var(--font-weight-medium, 500); color: var(--color-text-primary, #0f1117); }
        .field__label span { color: var(--color-accent-primary, #0047ff); }
        .field__input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: var(--radius-md, 0.5rem);
          border: 1px solid var(--color-border, #e2e8f0);
          background: var(--color-bg-secondary, #f8fafc);
          font: inherit;
          font-size: var(--font-size-sm, 0.875rem);
          color: var(--color-text-primary, #0f1117);
          transition: border-color 0.15s, box-shadow 0.15s;
          outline: none;
          resize: none;
        }
        .field__input:focus {
          border-color: var(--color-accent-primary, #0047ff);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent-primary, #0047ff) 15%, transparent);
          background: var(--color-bg-primary, #fff);
        }
        .field__input--invalid {
          border-color: var(--color-text-error, #e15151);
        }
        .field__input--invalid:focus {
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-text-error, #e15151) 15%, transparent);
        }
        .field__input--textarea { resize: vertical; min-height: 80px; }
        .field__error { font-size: 0.75rem; color: var(--color-text-error, #e15151); }
        /* honeypot полностью убран из визуального и tab-потока */
        .field__trap {
          position: absolute;
          left: -9999px;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
        }

        .modal__error {
          margin-top: 1rem;
          padding: 0.625rem 0.875rem;
          border-radius: var(--radius-md, 0.5rem);
          background: color-mix(in srgb, var(--color-text-error, #e15151) 10%, transparent);
          color: var(--color-text-error, #e15151);
          font-size: var(--font-size-sm, 0.875rem);
          line-height: 1.4;
        }

        .modal__actions { margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .modal__submit { width: 100%; position: relative; }
        .modal__privacy { font-size: 0.75rem; color: var(--color-text-dimmed, #94a3b8); text-align: center; line-height: 1.4; }

        .modal__submit.is-loading {
          pointer-events: none;
        }
        .modal__submit.is-loading::after {
          content: '';
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }

        .modal__success {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.75rem;
          padding-block: 1rem;
        }
        .modal__success-icon {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 50%;
          background: var(--color-accent-soft, #e8f0ff);
          color: var(--color-accent-primary, #0047ff);
          font-size: 1.5rem;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
        }
      `}</style>
    </>
  );
}
