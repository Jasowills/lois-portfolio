// Contact drawer (DESIGN_SPEC 10 + MOTION_SPEC 10): right-side sheet on
// desktop, bottom sheet on mobile. Simple form (name, email, "what are you
// building?") posting to VITE_FORM_ENDPOINT (Formspree), falling back to
// mailto until one is set.
//
// Motion: slides with the `glide` ease, fields stagger in (opacity + y, 70ms).
// Reduced motion shows everything instantly. Accessibility: role="dialog",
// aria-modal, labelled by the title, Escape and the backdrop close it, Tab
// cycles inside, focus starts on the first field and returns to the trigger
// on close, and every field has a linked, announced error message.

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { EASE_BEZIER } from '../motion/ease';
import { useMediaQuery } from '../motion/useMediaQuery';
import { useMotion } from '../motion/useMotion';
import { Button } from './ui/Button';

const DRAWER_EMAIL = 'loisjasmine03@gmail.com';
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

type ContactDrawerProps = {
  open: boolean;
  onClose: () => void;
};

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
};

function Field({ id, label, error, children }: FieldProps) {
  return (
    <motion.div
      className="cta-field"
      variants={{
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_BEZIER.glide } },
      }}
    >
      <label className="cta-field-label" htmlFor={id}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="cta-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </motion.div>
  );
}

const FIELD_ORDER = ['name', 'email', 'building'] as const;

export function ContactDrawer({ open, onClose }: ContactDrawerProps) {
  const { reducedMotion } = useMotion();
  const isSheet = useMediaQuery('(max-width: 899px)');

  const panelRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [building, setBuilding] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; building?: string }>({});
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [sentVia, setSentVia] = useState<'endpoint' | 'mailto' | null>(null);

  // Focus starts on the first field and returns to whatever opened the drawer.
  // Body scroll locks while the dialog is open; Escape and the backdrop close.
  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const id = window.requestAnimationFrame(() => nameRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(id);
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus({ preventScroll: true });
    };
  }, [open]);

  // Once the exit animation is done, clear the form so a reopen starts fresh.
  useEffect(() => {
    if (open) return;
    const id = window.setTimeout(() => {
      setName('');
      setEmail('');
      setBuilding('');
      setErrors({});
      setState('idle');
      setSentVia(null);
    }, 500);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = panel.querySelectorAll<HTMLElement>(
      'input, textarea, button:not([disabled]), a[href]',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const validate = () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Tell me your name.';
    if (!EMAIL_PATTERN.test(email.trim())) next.email = 'That email looks off. Check the address.';
    if (!building.trim()) next.building = 'A line about the project is all I need.';
    setErrors(next);
    return next;
  };

  const send = async () => {
    if (state === 'sending') return;
    const next = validate();
    if (Object.keys(next).length > 0) {
      const first = FIELD_ORDER.find((field) => next[field]);
      if (first) document.getElementById(`cta-drawer-${first}`)?.focus();
      return;
    }

    const endpoint = import.meta.env.VITE_FORM_ENDPOINT as string | undefined;
    if (endpoint) {
      setState('sending');
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new URLSearchParams({
            name: name.trim(),
            email: email.trim(),
            message: `${building.trim()}\n\nFrom: ${name.trim()} (${email.trim()})`,
            _subject: `New project inquiry from ${name.trim()}`,
          }),
        });
        setState(response.ok ? 'sent' : 'error');
        setSentVia(response.ok ? 'endpoint' : null);
      } catch {
        setState('error');
        setSentVia(null);
      }
      return;
    }

    const subject = encodeURIComponent(`New project inquiry from ${name.trim()}`);
    const body = encodeURIComponent(
      `Name: ${name.trim()}\nEmail: ${email.trim()}\n\nWhat they're building:\n${building.trim()}`,
    );
    try {
      window.location.href = `mailto:${DRAWER_EMAIL}?subject=${subject}&body=${body}`;
    } catch {
      // Headless/test environments cannot open the mail handler; the sent state still applies.
    }
    setSentVia('mailto');
    setState('sent');
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void send();
  };

  const offSheet = isSheet ? { y: '104%' } : { x: '104%' };
  const instant = reducedMotion ? { duration: 0 } : undefined;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="cta-drawer-backdrop"
            role="presentation"
            aria-hidden="true"
            className="cta-backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={instant ?? { duration: 0.25, ease: EASE_BEZIER.glide }}
          />
          <motion.div
            key="cta-drawer-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cta-drawer-title"
            className="cta-drawer"
            initial={offSheet}
            animate={{ x: 0, y: 0 }}
            exit={offSheet}
            transition={instant ?? { duration: 0.45, ease: EASE_BEZIER.glide }}
            onKeyDown={onKeyDown}
          >
            <div className="cta-drawer-inner">
              <div className="cta-drawer-head">
                <h3 id="cta-drawer-title" className="cta-drawer-title">
                  Let’s talk
                </h3>
                <button
                  type="button"
                  className="cta-drawer-close"
                  onClick={onClose}
                  aria-label="Close contact form"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true" focusable="false">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {state === 'sent' ? (
                <div className="cta-drawer-sent" role="status">
                  <p className="cta-sent-title">Thanks{name.trim() ? `, ${name.trim()}` : ''}.</p>
                  <p className="cta-sent-body">
                    {sentVia === 'mailto'
                      ? 'Your mail app should open with the message ready to send. If it doesn’t, email me at loisjasmine03@gmail.com.'
                      : 'I’ll get back to you as soon as I can.'}
                  </p>
                  <Button label="Close" fill="var(--yellow)" onClick={onClose} />
                </div>
              ) : (
                <form className="cta-drawer-form" id="cta-drawer-form" onSubmit={onSubmit} noValidate>
                  <motion.div
                    className="cta-drawer-fields"
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: {},
                      show: {
                        transition: {
                          staggerChildren: reducedMotion ? 0 : 0.07,
                          delayChildren: reducedMotion ? 0 : 0.18,
                        },
                      },
                    }}
                  >
                    <Field id="cta-drawer-name" label="Name" error={errors.name}>
                      <input
                        ref={nameRef}
                        id="cta-drawer-name"
                        className="cta-input"
                        type="text"
                        autoComplete="name"
                        placeholder="Your name"
                        value={name}
                        aria-invalid={errors.name ? true : undefined}
                        aria-describedby={errors.name ? 'cta-drawer-name-error' : undefined}
                        onChange={(event) => {
                          setName(event.target.value);
                          if (errors.name) setErrors((current) => ({ ...current, name: undefined }));
                        }}
                      />
                    </Field>

                    <Field id="cta-drawer-email" label="Email" error={errors.email}>
                      <input
                        id="cta-drawer-email"
                        className="cta-input"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="you@studio.com"
                        value={email}
                        aria-invalid={errors.email ? true : undefined}
                        aria-describedby={errors.email ? 'cta-drawer-email-error' : undefined}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
                        }}
                      />
                    </Field>

                    <Field id="cta-drawer-building" label="What are you building?" error={errors.building}>
                      <textarea
                        id="cta-drawer-building"
                        className="cta-input cta-textarea"
                        rows={5}
                        placeholder="A new brand, a campaign, a product..."
                        value={building}
                        aria-invalid={errors.building ? true : undefined}
                        aria-describedby={errors.building ? 'cta-drawer-building-error' : undefined}
                        onChange={(event) => {
                          setBuilding(event.target.value);
                          if (errors.building) setErrors((current) => ({ ...current, building: undefined }));
                        }}
                      />
                    </Field>
                  </motion.div>

                  {state === 'error' ? (
                    <p className="cta-form-error" role="alert">
                      That didn’t send. It might be the connection, so try again, or email me at{' '}
                      <a className="cta-form-error-link" href="mailto:loisjasmine03@gmail.com">
                        loisjasmine03@gmail.com
                      </a>
                      .
                    </p>
                  ) : null}

                  <div className="cta-drawer-actions">
                    <Button
                      label={state === 'sending' ? 'Sending…' : 'Send'}
                      fill="var(--lime)"
                      onClick={() => void send()}
                      disabled={state === 'sending'}
                    />
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
