'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AuthGate } from '@/components/auth-gate';
import { CreditAmount } from '@/components/credit-display';
import { api, apiErrorMessage } from '@/lib/api';
import { CreditPack, LedgerEntry } from '@/lib/types';

const LABELS: Record<LedgerEntry['type'], string> = {
  WELCOME_BONUS: 'Welcome bonus',
  STAKE: 'Quiz stake',
  QUIZ_REWARD: 'Quiz reward',
  PURCHASE: 'Credit purchase',
};

export default function WalletPage() {
  return (
    <AuthGate player>
      <Wallet />
    </AuthGate>
  );
}

function Wallet() {
  const [balance, setBalance] = useState<number | null>(null);
  const [items, setItems] = useState<LedgerEntry[]>([]);
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [packId, setPackId] = useState('pack_200');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function load() {
    const [balanceBody, ledger, packBody] = await Promise.all([
      api<{ balance: number }>('/credits/balance'),
      api<{ items: LedgerEntry[] }>('/credits/transactions'),
      api<{ items: CreditPack[] }>('/credits/packs'),
    ]);
    setBalance(balanceBody.balance);
    setItems(ledger.items);
    setPacks(packBody.items);
  }

  useEffect(() => {
    load().catch((caught) => setError(apiErrorMessage(caught, 'Could not load your wallet')));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    setMessage('');
    try {
      const result = await api<{ replayed: boolean; balance: number; credits: number }>('/credits/purchase', {
        method: 'POST',
        body: JSON.stringify({ packId, idempotencyKey: `web-${crypto.randomUUID()}` }),
      });
      setMessage(`Added ${result.credits} credits. Balance is now ${result.balance}.`);
      await load();
    } catch (caught) {
      setError(apiErrorMessage(caught, 'Purchase failed'));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="page-header">
        <p className="label">Wallet</p>
        <h1 className="page-title">
          <CreditAmount value={balance} className="gap-2 text-4xl [&_svg]:size-8" />
        </h1>
        <p className="page-lede">Every change is a ledger row. The balance is the latest settled total.</p>
      </header>
      <form onSubmit={onSubmit} className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
        <label className="block flex-1">
          <span className="label">Credit pack</span>
          <select className="field" value={packId} onChange={(event) => setPackId(event.target.value)}>
            {packs.map((pack) => (
              <option key={pack.id} value={pack.id}>
                {pack.credits} credits · {pack.priceLabel}
              </option>
            ))}
          </select>
        </label>
        <button className="btn" type="submit" disabled={pending || packs.length === 0}>
          {pending ? 'Buying…' : 'Buy credits'}
        </button>
      </form>
      {message && <p className="text-sm text-teal">{message}</p>}
      {error && <p className="alert-error">{error}</p>}
      <ul className="list-panel divide-y divide-line">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <div>
              <p className="font-semibold">{LABELS[item.type]}</p>
              <p className="text-moss">{new Date(item.createdAt).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className={`inline-flex items-center gap-1 ${item.amount < 0 ? 'text-debit' : 'text-success'}`}>
                {item.amount > 0 ? '+' : item.amount < 0 ? '−' : ''}
                <CreditAmount value={Math.abs(item.amount)} />
              </p>
              <p className="text-moss">bal {item.balanceAfter}</p>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="px-4 py-3 text-sm text-moss">No ledger entries yet.</li>}
      </ul>
    </div>
  );
}
