'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { readUser } from '@/lib/session';
import { PageLoader } from './loading-spinner';
import { Shell } from './shell';

export function AuthGate({
  admin = false,
  player = false,
  children,
}: {
  admin?: boolean;
  /** Player-only routes (quizzes, wallet, attempts). Admins are sent to the admin console. */
  player?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = readUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    if (admin && user.role !== 'ADMIN') {
      router.replace('/quizzes');
      return;
    }
    if (player && user.role === 'ADMIN') {
      router.replace('/admin/quizzes');
      return;
    }
    setReady(true);
  }, [admin, player, router]);

  if (!ready) return <PageLoader padded />;
  return <Shell>{children}</Shell>;
}
