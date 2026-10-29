'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { readUser } from '@/lib/session';

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    const user = readUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    router.replace(user.role === 'ADMIN' ? '/admin/quizzes' : '/quizzes');
  }, [router]);
  return <p className="p-8 text-sm text-moss">Loading…</p>;
}
