'use client';

import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { AuthGate } from '@/components/auth-gate';
import { CreditAmount } from '@/components/credit-display';
import { api, apiErrorMessage } from '@/lib/api';
import { AttemptView } from '@/lib/types';

export default function AttemptPage() {
  return (
    <AuthGate player>
      <AttemptForm />
    </AuthGate>
  );
}

function AttemptForm() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [attempt, setAttempt] = useState<AttemptView | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    api<AttemptView>(`/attempts/${params.id}`)
      .then((body) => {
        if (body.status === 'SETTLED') {
          router.replace(`/attempts/${body.id}/result`);
          return;
        }
        setAttempt(body);
      })
      .catch((caught) => setError(apiErrorMessage(caught, 'Could not load this attempt')));
  }, [params.id, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!attempt) return;
    setPending(true);
    setError('');
    try {
      await api(`/attempts/${attempt.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          answers: attempt.questions.map((question) => ({
            questionId: question.id,
            selectedIndex: answers[question.id],
          })),
        }),
      });
      router.push(`/attempts/${attempt.id}/result`);
    } catch (caught) {
      setError(apiErrorMessage(caught, 'Could not submit'));
      setPending(false);
    }
  }

  if (!attempt && !error) return <p className="text-sm text-moss">Loading attempt…</p>;
  if (!attempt) return <p className="alert-error">{error}</p>;

  const ready = attempt.questions.every((question) => answers[question.id] !== undefined);

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
      <header className="page-header">
        <p className="label flex flex-wrap items-center gap-x-1 gap-y-1">
          <span className="inline-flex items-center gap-1">
            Stake <CreditAmount value={attempt.stakeAmount} />
          </span>
          <span>· pass {attempt.quiz.passMark}% ·</span>
          <span className="inline-flex items-center gap-1">
            reward <CreditAmount value={attempt.quiz.reward} />
          </span>
        </p>
        <h1 className="page-title">{attempt.quiz.title}</h1>
      </header>
      <div className="space-y-4">
        {attempt.questions.map((question, index) => {
          const headingId = `question-${question.id}`;
          return (
            <article key={question.id} className="panel p-5">
              <h2 id={headingId} className="font-semibold leading-snug">
                {index + 1}. {question.prompt}
              </h2>
              <div
                role="radiogroup"
                aria-labelledby={headingId}
                className="mt-4 space-y-2"
              >
                {question.options.map((option, optionIndex) => {
                  const selected = answers[question.id] === optionIndex;
                  return (
                    <label
                      key={option}
                      className={`choice ${selected ? 'choice-selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        className="size-4 shrink-0 accent-teal"
                        checked={selected}
                        onChange={() =>
                          setAnswers((current) => ({ ...current, [question.id]: optionIndex }))
                        }
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
      {error && <p className="alert-error">{error}</p>}
      <button className="btn" type="submit" disabled={!ready || pending}>
        {pending ? 'Scoring…' : 'Submit answers'}
      </button>
    </form>
  );
}
