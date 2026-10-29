'use client';

import { useEffect, useState } from 'react';
import { AuthGate } from '@/components/auth-gate';
import { CreditAmount } from '@/components/credit-display';
import { api, apiErrorMessage } from '@/lib/api';
import { readUser } from '@/lib/session';
import { LeaderboardEntry } from '@/lib/types';

export default function LeaderboardPage() {
  return (
    <AuthGate>
      <Leaderboard />
    </AuthGate>
  );
}

function Leaderboard() {
  const [items, setItems] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState('');
  const isAdmin = readUser()?.role === 'ADMIN';

  useEffect(() => {
    api<{ items: LeaderboardEntry[] }>('/leaderboard')
      .then((body) => setItems(body.items))
      .catch((caught) => setError(apiErrorMessage(caught, 'Could not load the leaderboard')));
  }, []);

  return (
    <div className="space-y-6">
      <header className="page-header">
        <p className="label">Rankings</p>
        <h1 className="page-title">Leaderboard</h1>
        <p className="page-lede">
          Players ranked by total quiz rewards from passed attempts. Ties break on pass count, then
          name.
        </p>
      </header>
      {error && <p className="alert-error">{error}</p>}
      <div className="list-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-sand/80 text-[11px] uppercase tracking-[0.14em] text-moss">
            <tr>
              <th className="px-4 py-3 font-semibold">Rank</th>
              <th className="px-4 py-3 font-semibold">Player</th>
              {isAdmin && <th className="px-4 py-3 font-semibold">Email</th>}
              <th className="px-4 py-3 font-semibold">Quizzes passed</th>
              <th className="px-4 py-3 font-semibold">Rewards earned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((row) => (
              <tr key={`${row.rank}-${row.displayName}`}>
                <td className="px-4 py-3 font-semibold">{row.rank}</td>
                <td className="px-4 py-3">{row.displayName}</td>
                {isAdmin && (
                  <td className="px-4 py-3 text-moss">{row.email ?? '—'}</td>
                )}
                <td className="px-4 py-3">{row.quizzesPassed}</td>
                <td className="px-4 py-3">
                  <CreditAmount value={row.totalRewards} />
                </td>
              </tr>
            ))}
            {items.length === 0 && !error && (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="px-4 py-6 text-moss">
                  No passed attempts yet. Be the first on the board.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
