import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface UserMenuProps {
  /** Analyzer passes this to add a "My saved flights" entry; landing page omits it. */
  onOpenSavedFlights?: () => void;
}

export function UserMenu({ onOpenSavedFlights }: UserMenuProps) {
  const { user, signOutUser } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;
  const email = user.email || user.displayName || '';

  return (
    <div className="usermenu" ref={rootRef}>
      <button
        className="usermenu-trigger"
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="usermenu-panel">
          <div className="usermenu-email mono">{email}</div>
          {onOpenSavedFlights && (
            <button
              className="usermenu-item"
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenSavedFlights();
              }}
            >
              My saved flights
            </button>
          )}
          <button
            className="usermenu-item"
            type="button"
            onClick={() => {
              setOpen(false);
              signOutUser();
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
