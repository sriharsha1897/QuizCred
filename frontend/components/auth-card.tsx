'use client';

import { FormEvent, ReactNode, useState } from 'react';
import { PasswordField } from '@/components/password-field';
import { APP_NAME } from '@/lib/brand';
import { EMAIL_MAX_LENGTH, validateEmail } from '@/lib/email';

export function AuthCard({
  title,
  lede,
  error,
  success = '',
  onSubmit,
  pending,
  submitLabel,
  email,
  password,
  setEmail,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  footer,
}: {
  title: string;
  lede: string;
  error: string;
  success?: string;
  onSubmit: (event: FormEvent) => void;
  pending: boolean;
  submitLabel: string;
  email: string;
  password: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  confirmPassword?: string;
  setConfirmPassword?: (value: string) => void;
  footer: ReactNode;
}) {
  const [emailHint, setEmailHint] = useState('');

  function onEmailBlur() {
    setEmailHint(email.trim() ? validateEmail(email) ?? '' : '');
  }

  return (
    <div className="auth-shell">
      <p className="auth-brand">{APP_NAME}</p>
      <div className="panel mt-6 p-6">
        <h1 className="section-title">{title}</h1>
        <p className="page-lede mt-2">{lede}</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="label">Email</span>
            <input
              className="field"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
              maxLength={EMAIL_MAX_LENGTH}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (emailHint) setEmailHint('');
              }}
              onBlur={onEmailBlur}
              aria-invalid={emailHint ? true : undefined}
              required
            />
            {emailHint && <p className="mt-1 text-xs text-debit">{emailHint}</p>}
          </label>
          <label className="block">
            <span className="label">Password</span>
            <PasswordField
              value={password}
              minLength={8}
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {setConfirmPassword && (
            <label className="block">
              <span className="label">Confirm password</span>
              <PasswordField
                value={confirmPassword ?? ''}
                minLength={8}
                autoComplete="new-password"
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </label>
          )}
          {success && <p className="text-sm text-success">{success}</p>}
          {error && <p className="alert-error">{error}</p>}
          <button className="btn w-full" type="submit" disabled={pending}>
            {pending ? 'Please wait…' : submitLabel}
          </button>
        </form>
        <div className="mt-5">{footer}</div>
      </div>
    </div>
  );
}
