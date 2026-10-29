'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageLoader } from '@/components/loading-spinner';
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
  return <PageLoader padded />;
}
