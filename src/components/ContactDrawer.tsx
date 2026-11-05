// Contact drawer (DESIGN_SPEC phase 9 + MOTION_SPEC section 10): right-side
// drawer with name, email and "what are you building?", posting to the
// VITE_FORM_ENDPOINT form endpoint, falling back to mailto until one is set.

import { useState } from 'react';
import { Button } from './ui/Button';

const DRAWER_EMAIL = 'loisjasmine03@gmail.com';

type ContactDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function ContactDrawer({ open, onClose }: ContactDrawerProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [building, setBuilding] = useState('');
  const [sent, setSent] = useState(false);

  if (!open) return null;

  const send = () => {
    const endpoint = import.meta.env.VITE_FORM_ENDPOINT as string | undefined;
    if (endpoint) {
      const body = new URLSearchParams({ name, email, message: building });
      fetch(endpoint, { method: 'POST', body }).catch(() => undefined);
      setSent(true);
      return;
    }
    window.location.href = `mailto:${DRAWER_EMAIL}?subject=${encodeURIComponent('New project inquiry')}&body=${encodeURIComponent(`${name} (${email}) wants: ${building}`)}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: '420px',
        maxWidth: '92vw',
        background: 'var(--cream)',
        borderLeft: '1px solid var(--ink)',
        zIndex: 60,
        overflowY: 'auto',
      }}
    >
      <div style={{ padding: '32px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h3 style={{ fontFamily: 'var(--ff-ink)', fontSize: '32px', lineHeight: '40px', color: 'var(--heading)', margin: 0 }}>Let's talk</h3>
          <button type="button" onClick={onClose} aria-label="Close contact drawer" style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--ink)' }}>
            ×
          </button>
        </div>

        {sent ? (
          <p style={{ fontFamily: 'var(--ff-outfit)', fontSize: '20px', lineHeight: '28px', color: 'var(--body)' }}>
            Thanks, {name || 'friend'}. I'll get back to you.
          </p>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="cta-drawer-name" style={{ display: 'block', fontFamily: 'var(--ff-outfit)', fontSize: '14px', color: 'var(--body)', marginBottom: '8px' }}>
                Name
              </label>
              <input id="cta-drawer-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={{ width: '100%', padding: '12px', border: '1px solid var(--ink)', borderRadius: '8px', fontFamily: 'var(--ff-outfit)', fontSize: '16px' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="cta-drawer-email" style={{ display: 'block', fontFamily: 'var(--ff-outfit)', fontSize: '14px', color: 'var(--body)', marginBottom: '8px' }}>
                Email
              </label>
              <input id="cta-drawer-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.com" style={{ width: '100%', padding: '12px', border: '1px solid var(--ink)', borderRadius: '8px', fontFamily: 'var(--ff-outfit)', fontSize: '16px' }} />
            </div>
            <div style={{ marginBottom: '28px' }}>
              <label htmlFor="cta-drawer-building" style={{ display: 'block', fontFamily: 'var(--ff-outfit)', fontSize: '14px', color: 'var(--body)', marginBottom: '8px' }}>
                What are you building?
              </label>
              <textarea id="cta-drawer-building" value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="A new brand, a campaign, a product..." rows={5} style={{ width: '100%', padding: '12px', border: '1px solid var(--ink)', borderRadius: '8px', fontFamily: 'var(--ff-outfit)', fontSize: '16px', resize: 'vertical' }} />
            </div>
            <Button label="Send" fill="var(--lime)" onClick={send} />
          </>
        )}
      </div>
    </div>
  );
}
