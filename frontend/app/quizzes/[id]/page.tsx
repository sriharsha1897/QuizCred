'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthGate } from '@/components/auth-gate';
import { CreditAmount } from '@/components/credit-display';
import { api, apiErrorMessage } from '@/lib/api';
import { AttemptView, QuizSummary, QuestionView } from '@/lib/types';

type QuizDetail = QuizSummary & { questions: QuestionView[] };

export default function QuizDetailPage() {
  return (
    <AuthGate player>
      <QuizDetail />
    </AuthGate>
  );
}

function QuizDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    api<QuizDetail>(`/quizzes/${params.id}`)
      .then(setQuiz)
      .catch((caught) => setError(apiErrorMessage(caught, 'Could not load this quiz')));
  }, [params.id]);

  async function start() {
    setPending(true);
    setError('');
    try {
      const attempt = await api<AttemptView>(`/quizzes/${params.id}/attempts`, { method: 'POST' });
      router.push(`/attempts/${attempt.id}`);
    } catch (caught) {
      setError(apiErrorMessage(caught, 'Could not start the quiz'));
      setPending(false);
    }
  }

  if (!quiz && !error) return <p className="text-sm text-moss">Loading quiz…</p>;

  return (
    <div className="space-y-6">
      <Link href="/quizzes" className="link-accent text-sm">
        Back to quizzes
      </Link>
      {error && <p className="alert-error">{error}</p>}
      {quiz && (
        <div className="panel p-6">
          <p className="label">{quiz.questionCount} questions</p>
          <h1 className="page-title">{quiz.title}</h1>
          <p className="page-lede mt-3">{quiz.description}</p>
          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            <Fact label="Stake taken now" credits={quiz.stake} />
            <Fact label="Reward if you pass" credits={quiz.reward} />
            <Fact label="Pass mark" value={`${quiz.passMark}%`} />
          </dl>
          <button className="btn mt-6" type="button" onClick={start} disabled={pending}>
            {pending ? 'Staking…' : `Start and stake ${quiz.stake}`}
          </button>
        </div>
      )}
    </div>
  );
}

function Fact({
  label,
  value,
  credits,
}: {
  label: string;
  value?: string;
  credits?: number;
}) {
  return (
    <div className="stat-tile px-4 py-3">
      <dt className="stat-label">{label}</dt>
      <dd className="mt-1 font-semibold">
        {credits !== undefined ? <CreditAmount value={credits} /> : value}
      </dd>
    </div>
  );
}
