'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { SessionUser } from '@/lib/types';

function displayName(user: SessionUser) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.email.split('@')[0] || 'Account';
}

function avatarInitial(user: SessionUser) {
  const fromName = user.firstName?.trim().charAt(0) || user.lastName?.trim().charAt(0);
  const letter = fromName || user.email.trim().charAt(0) || '?';
  return letter.toUpperCase();
}

export function UserMenu({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const name = displayName(user);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="user-avatar"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        title={user.email}
        onClick={() => setOpen((v) => !v)}
      >
        {avatarInitial(user)}
      </button>
      {open ? (
        <div id={menuId} role="menu" className="user-menu-panel">
          <Link
            href="/profile"
            role="menuitem"
            className="user-menu-item"
            onClick={() => setOpen(false)}
          >
            {name}
          </Link>
          <button
            type="button"
            role="menuitem"
            className="user-menu-item user-menu-item-muted"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
