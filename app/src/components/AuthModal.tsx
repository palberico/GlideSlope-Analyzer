import { useEffect, useState, type FormEvent } from 'react';
import type { AuthError } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';
import { friendlyAuthError } from '../lib/firebase';

interface AuthModalProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  note?: string;
}

export function AuthModal({
  open,
  onClose,
  title = 'Sign in to continue',
  note = 'Sign in to continue.',
}: AuthModalProps) {
  const { configured, signInGoogle, signInEmail, signUpEmail } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) setErr('');
  }, [open]);

  useEffect(() => {
    if (!onClose) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose!();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function showErr(e: unknown) {
    setErr(friendlyAuthError(e as AuthError));
  }

  async function handleGoogle() {
    try {
      await signInGoogle();
    } catch (e) {
      showErr(e);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!configured) return;
    try {
      if (mode === 'signin') await signInEmail(email, password);
      else await signUpEmail(email, password);
    } catch (e) {
      showErr(e);
    }
  }

  return (
    <div
      className={`modal-backdrop${open ? '' : ' hidden'}`}
      onClick={(e) => {
        if (onClose && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="authgate">
        {onClose && (
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            &times;
          </button>
        )}
        <h3>{title}</h3>
        <p className="note">{note}</p>
        <button className="btn" type="button" onClick={handleGoogle} disabled={!configured}>
          Continue with Google
        </button>
        <div className="authdivider">or</div>
        <form onSubmit={handleSubmit}>
          <input
            className="authinput mono"
            type="email"
            placeholder="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="authinput mono"
            type="password"
            placeholder="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="authrow">
            <button className="btn ghost" type="submit">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
            <button
              className="authtoggle"
              type="button"
              onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
            >
              {mode === 'signin' ? 'Need an account? Create one' : 'Have an account? Sign in'}
            </button>
          </div>
        </form>
        {err && <div className="err">{err}</div>}
        {!configured && (
          <div className="cfgwarn">Firebase not configured — see README, then reload</div>
        )}
      </div>
    </div>
  );
}
