'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { AuthCard } from '@/components/auth-card';
import { api, apiErrorMessage } from '@/lib/api';
import { normalizeEmail, validateEmail } from '@/lib/email';
import { saveSession } from '@/lib/session';
import { AuthResponse } from '@/lib/types';

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-sm text-moss">Loading sign in…</p>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('user@quiz.com');
  const [password, setPassword] = useState('User123!');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') !== '1') return;
    const prefill = searchParams.get('email');
    if (prefill) setEmail(prefill);
    setPassword('');
    setSuccess('Account created. Sign in with your email and password.');
  }, [searchParams]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    const normalizedEmail = normalizeEmail(email);
    if (normalizedEmail !== email) setEmail(normalizedEmail);
    setPending(true);
    setError('');
    setSuccess('');
    try {
      const body = await api<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      saveSession(body.accessToken, body.user);
      router.replace(body.user.role === 'ADMIN' ? '/admin/quizzes' : '/quizzes');
    } catch (caught) {
      setError(apiErrorMessage(caught, 'Could not sign in'));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard
      title="Sign in"
      lede="Stake credits on a quiz. A pass pays the reward. A fail keeps the stake."
      error={error}
      success={success}
      onSubmit={onSubmit}
      pending={pending}
      submitLabel="Sign in"
      email={email}
      password={password}
      setEmail={setEmail}
      setPassword={setPassword}
      footer={
        <p className="text-sm text-moss">
          New here?{' '}
          <Link href="/register" className="link-accent">
            Create an account
          </Link>
        </p>
      }
    />
  );
}
