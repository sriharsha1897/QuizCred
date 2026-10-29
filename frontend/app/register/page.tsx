'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { AuthCard } from '@/components/auth-card';
import { api, apiErrorMessage } from '@/lib/api';
import { normalizeEmail, validateEmail } from '@/lib/email';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const normalizedEmail = normalizeEmail(email);
    if (normalizedEmail !== email) setEmail(normalizedEmail);
    setPending(true);
    try {
      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      router.replace(`/login?registered=1&email=${encodeURIComponent(normalizedEmail)}`);
    } catch (caught) {
      setError(apiErrorMessage(caught, 'Could not create the account'));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard
      title="Create an account"
      lede="New accounts start with 500 credits. That balance is a ledger entry, not a number typed into the form."
      error={error}
      onSubmit={onSubmit}
      pending={pending}
      submitLabel="Create account"
      email={email}
      password={password}
      confirmPassword={confirmPassword}
      setEmail={setEmail}
      setPassword={setPassword}
      setConfirmPassword={setConfirmPassword}
      footer={
        <p className="text-sm text-moss">
          Already registered?{' '}
          <Link href="/login" className="link-accent">
            Sign in
          </Link>
        </p>
      }
    />
  );
}
