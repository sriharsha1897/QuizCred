'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuthGate } from '@/components/auth-gate';
import { CreditAmount } from '@/components/credit-display';
import { api, apiErrorMessage } from '@/lib/api';
import { AttemptListItem, QuizSummary } from '@/lib/types';

export default function QuizzesPage() {
  return (
    <AuthGate player>
      <QuizList />
    </AuthGate>
  );
}

function QuizList() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [attempts, setAttempts] = useState<AttemptListItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api<{ items: QuizSummary[] }>('/quizzes'),
      api<{ items: AttemptListItem[] }>('/attempts'),
    ])
      .then(([quizBody, attemptBody]) => {
        setQuizzes(quizBody.items);
        setAttempts(attemptBody.items);
      })
      .catch((caught) => setError(apiErrorMessage(caught, 'Could not load quizzes')));
  }, []);

  return (
    <div className="space-y-8">
      <header className="page-header">
        <p className="label">Catalog</p>
        <h1 className="page-title">Published quizzes</h1>
        <p className="page-lede">
          Starting a quiz deducts its stake immediately. Submit every answer and the server scores the attempt.
        </p>
      </header>
      {error && <p className="alert-error">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {quizzes.map((quiz) => (
          <Link key={quiz.id} href={`/quizzes/${quiz.id}`} className="panel block p-5 transition hover:-translate-y-0.5">
            <h2 className="font-serif text-2xl">{quiz.title}</h2>
            <p className="mt-2 text-sm leading-6 text-moss">{quiz.description}</p>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <Stat label="Stake" credits={quiz.stake} />
              <Stat label="Reward" credits={quiz.reward} />
              <Stat label="Pass" value={`${quiz.passMark}%`} />
            </dl>
          </Link>
        ))}
        {quizzes.length === 0 && !error && <p className="text-sm text-moss">No published quizzes yet.</p>}
      </div>
      <section>
        <h2 className="section-title">Your attempts</h2>
        <ul className="list-panel mt-3 divide-y divide-line">
          {attempts.map((attempt) => (
            <li key={attempt.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-semibold">{attempt.quiz.title}</p>
                <p className="text-moss">
                  {attempt.status === 'SETTLED'
                    ? `${attempt.passed ? 'Passed' : 'Failed'} · ${attempt.score}%`
                    : 'In progress'}
                </p>
              </div>
              <Link
                className="link-accent"
                href={attempt.status === 'SETTLED' ? `/attempts/${attempt.id}/result` : `/attempts/${attempt.id}`}
              >
                Open
              </Link>
            </li>
          ))}
          {attempts.length === 0 && <li className="px-4 py-3 text-sm text-moss">No attempts yet.</li>}
        </ul>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  credits,
}: {
  label: string;
  value?: string;
  credits?: number;
}) {
  return (
    <div className="stat-tile">
      <dt className="stat-label">{label}</dt>
      <dd className="font-semibold">
        {credits !== undefined ? <CreditAmount value={credits} /> : value}
      </dd>
    </div>
  );
}
