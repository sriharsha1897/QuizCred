'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthGate } from '@/components/auth-gate';
import { CreditAmount } from '@/components/credit-display';
import { api, apiErrorMessage } from '@/lib/api';
import { AttemptView } from '@/lib/types';

export default function ResultPage() {
  return (
    <AuthGate player>
      <Result />
    </AuthGate>
  );
}

function Result() {
  const params = useParams<{ id: string }>();
  const [attempt, setAttempt] = useState<AttemptView | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<AttemptView>(`/attempts/${params.id}`)
      .then(setAttempt)
      .catch((caught) => setError(apiErrorMessage(caught, 'Could not load this result')));
  }, [params.id]);

  if (!attempt && !error) return <p className="text-sm text-moss">Loading result…</p>;
  if (!attempt) return <p className="alert-error">{error}</p>;
  if (attempt.status !== 'SETTLED') {
    return (
      <p className="text-sm">
        This attempt is still open.{' '}
        <Link className="link-accent" href={`/attempts/${attempt.id}`}>
          Continue
        </Link>
      </p>
    );
  }

  const net = (attempt.rewardAmount ?? 0) - attempt.stakeAmount;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="panel p-6">
        <p className="label">{attempt.passed ? 'Passed' : 'Failed'}</p>
        <h1 className="page-title">{attempt.quiz.title}</h1>
        <p className="mt-3 text-sm text-moss">
          Score {attempt.score}% · pass mark {attempt.quiz.passMark}% · balance{' '}
          <CreditAmount value={attempt.accountBalance} />
        </p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <Fact label="Stake" sign="−" amount={attempt.stakeAmount} />
          <Fact label="Reward" sign="+" amount={attempt.rewardAmount ?? 0} />
          <Fact label="Net" sign={net >= 0 ? '+' : '−'} amount={Math.abs(net)} />
        </dl>
        <div className="mt-6 flex gap-3">
          <Link className="btn" href="/quizzes">
            Back to quizzes
          </Link>
          <Link className="btn-ghost" href="/wallet">
            Open wallet
          </Link>
        </div>
      </div>
      <div className="space-y-3">
        {attempt.questions.map((question) => {
          const selected = question.selectedIndex ?? null;
          const correct = question.correctIndex;
          return (
            <article key={question.id} className="panel p-5">
              <h2 className="font-semibold">{question.prompt}</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {question.options.map((option, index) => {
                  const isCorrect = index === correct;
                  const isSelected = index === selected;
                  return (
                    <li
                      key={option}
                      className={
                        isCorrect ? 'answer-correct' : isSelected ? 'answer-wrong' : 'answer-neutral'
                      }
                    >
                      {option}
                      {isCorrect ? ' · correct' : ''}
                      {isSelected ? ' · your answer' : ''}
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Fact({
  label,
  sign,
  amount,
}: {
  label: string;
  sign: '+' | '−' | '';
  amount: number;
}) {
  return (
    <div className="stat-tile px-4 py-3">
      <dt className="stat-label">{label}</dt>
      <dd className="mt-1 inline-flex items-center gap-0.5 font-semibold">
        {sign}
        <CreditAmount value={amount} />
      </dd>
    </div>
  );
}
