'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CreditAmount } from '@/components/credit-display';
import { ThemeToggle } from '@/components/theme-toggle';
import { APP_NAME } from '@/lib/brand';
import { api } from '@/lib/api';
import { clearSession, readUser } from '@/lib/session';
import { SessionUser } from '@/lib/types';

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const isAdmin = user?.role === 'ADMIN';
  const homeHref = isAdmin ? '/admin/quizzes' : '/quizzes';

  useEffect(() => {
    const current = readUser();
    setUser(current);
    if (!current || current.role === 'ADMIN') {
      setBalance(null);
      return;
    }
    let cancelled = false;
    api<{ balance: number }>('/credits/balance')
      .then((body) => {
        if (!cancelled) setBalance(body.balance);
      })
      .catch(() => {
        if (!cancelled) setBalance(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  function logout() {
    clearSession();
    router.replace('/login');
  }

  function navClass(active: boolean) {
    return active ? 'nav-link text-ink' : 'nav-link';
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line/90 bg-card/85 shadow-header backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
          <Link href={homeHref} className="font-serif text-2xl tracking-tight text-ink">
            {APP_NAME}
          </Link>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            {isAdmin ? (
              <>
                <Link href="/admin/quizzes" className={navClass(pathname.startsWith('/admin'))}>
                  Manage quizzes
                </Link>
                <Link href="/leaderboard" className={navClass(pathname === '/leaderboard')}>
                  Leaderboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/quizzes" className={navClass(pathname.startsWith('/quizzes'))}>
                  Quizzes
                </Link>
                <Link href="/leaderboard" className={navClass(pathname === '/leaderboard')}>
                  Leaderboard
                </Link>
                <Link href="/wallet" className={navClass(pathname === '/wallet')}>
                  Wallet
                </Link>
                <span className="badge-credits inline-flex items-center gap-1.5">
                  <CreditAmount value={balance} />
                </span>
              </>
            )}
            <Link href="/profile" className={navClass(pathname === '/profile')}>
              Profile
            </Link>
            <ThemeToggle />
            <button type="button" onClick={logout} className="nav-link">
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
