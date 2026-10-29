'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AuthGate } from '@/components/auth-gate';
import { PageLoader } from '@/components/loading-spinner';
import { PasswordField } from '@/components/password-field';
import { api, apiErrorMessage } from '@/lib/api';
import { readUser, updateStoredUser } from '@/lib/session';
import { SessionUser } from '@/lib/types';

export default function ProfilePage() {
  return (
    <AuthGate>
      <Profile />
    </AuthGate>
  );
}

function displayName(user: SessionUser | null) {
  if (!user) return 'Your profile';
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return user.email;
}

function Profile() {
  const [profile, setProfile] = useState<SessionUser | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profilePending, setProfilePending] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordPending, setPasswordPending] = useState(false);

  useEffect(() => {
    const cached = readUser();
    if (cached) {
      setProfile(cached);
      setFirstName(cached.firstName ?? '');
      setLastName(cached.lastName ?? '');
    }
    api<SessionUser>('/auth/me')
      .then((user) => {
        setProfile(user);
        setFirstName(user.firstName ?? '');
        setLastName(user.lastName ?? '');
        updateStoredUser(user);
      })
      .catch((caught) => setProfileError(apiErrorMessage(caught, 'Could not load profile')));
  }, []);

  async function onSaveProfile(event: FormEvent) {
    event.preventDefault();
    setProfileMessage('');
    setProfileError('');
    setProfilePending(true);
    try {
      const user = await api<SessionUser>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });
      setProfile(user);
      updateStoredUser(user);
      setProfileMessage('Profile saved.');
    } catch (caught) {
      setProfileError(apiErrorMessage(caught, 'Could not save profile'));
    } finally {
      setProfilePending(false);
    }
  }

  async function onChangePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordMessage('');
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    setPasswordPending(true);
    try {
      await api<void>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Password updated.');
    } catch (caught) {
      setPasswordError(apiErrorMessage(caught, 'Could not change password'));
    } finally {
      setPasswordPending(false);
    }
  }

  if (!profile && !profileError) {
    return <PageLoader />;
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <p className="label">Account</p>
        <h1 className="page-title">{displayName(profile)}</h1>
        {profile && <p className="mt-2 text-sm text-moss">{profile.email}</p>}
      </div>

      <form className="panel space-y-4 p-6" onSubmit={onSaveProfile}>
        <h2 className="section-title">Name</h2>
        {profileError && <p className="alert-error">{profileError}</p>}
        {profileMessage && <p className="text-sm text-success">{profileMessage}</p>}
        <label className="block text-sm">
          <span className="label mb-1 block">First name</span>
          <input
            className="input w-full"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            autoComplete="given-name"
            maxLength={80}
          />
        </label>
        <label className="block text-sm">
          <span className="label mb-1 block">Last name</span>
          <input
            className="input w-full"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            autoComplete="family-name"
            maxLength={80}
          />
        </label>
        <button type="submit" className="btn" disabled={profilePending}>
          {profilePending ? 'Saving…' : 'Save profile'}
        </button>
      </form>

      <form className="panel space-y-4 p-6" onSubmit={onChangePassword}>
        <h2 className="section-title">Change password</h2>
        {passwordError && <p className="alert-error">{passwordError}</p>}
        {passwordMessage && <p className="text-sm text-success">{passwordMessage}</p>}
        <label className="block text-sm">
          <span className="label mb-1 block">Current password</span>
          <PasswordField
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
            minLength={8}
          />
        </label>
        <label className="block text-sm">
          <span className="label mb-1 block">New password</span>
          <PasswordField
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
          />
        </label>
        <label className="block text-sm">
          <span className="label mb-1 block">Confirm new password</span>
          <PasswordField
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
          />
        </label>
        <button type="submit" className="btn" disabled={passwordPending}>
          {passwordPending ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
