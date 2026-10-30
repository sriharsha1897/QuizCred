'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { CreditAmount } from '@/components/credit-display';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserMenu } from '@/components/user-menu';
import { APP_NAME } from '@/lib/brand';
import { api } from '@/lib/api';
import { clearSession, readUser } from '@/lib/session';
import { SessionUser } from '@/lib/types';

function NavPill({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link href={href} className={`nav-pill ${active ? 'nav-pill-active' : ''}`}>
      {children}
    </Link>
  );
}

export function Shell({ children }: { children: ReactNode }) {
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

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line/90 bg-card/90 shadow-header backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={homeHref} className="group shrink-0">
              <span className="font-serif text-2xl tracking-tight text-ink transition group-hover:text-teal">
                {APP_NAME}
              </span>
            </Link>
            {isAdmin ? (
              <span className="rounded-full bg-teal-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal">
                Admin
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <nav className="nav-pills" aria-label="Main">
              {isAdmin ? (
                <>
                  <NavPill href="/admin/quizzes" active={pathname.startsWith('/admin')}>
                    Manage
                  </NavPill>
                  <NavPill href="/leaderboard" active={pathname === '/leaderboard'}>
                    Leaderboard
                  </NavPill>
                </>
              ) : (
                <>
                  <NavPill href="/quizzes" active={pathname.startsWith('/quizzes')}>
                    Quizzes
                  </NavPill>
                  <NavPill href="/leaderboard" active={pathname === '/leaderboard'}>
                    Leaderboard
                  </NavPill>
                  <NavPill href="/wallet" active={pathname === '/wallet'}>
                    Wallet
                  </NavPill>
                </>
              )}
            </nav>

            <div className="nav-actions">
              {!isAdmin ? (
                <span className="badge-credits inline-flex items-center gap-1.5 tabular-nums">
                  <CreditAmount value={balance} />
                </span>
              ) : null}
              <span className="nav-divider" aria-hidden />
              <ThemeToggle />
              {user ? <UserMenu user={user} onLogout={logout} /> : null}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
