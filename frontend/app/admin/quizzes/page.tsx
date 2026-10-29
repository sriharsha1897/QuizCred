"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { api, apiErrorMessage } from "@/lib/api";
import { QuizSummary } from "@/lib/types";

export default function AdminQuizzesPage() {
  return (
    <AuthGate admin>
      <AdminList />
    </AuthGate>
  );
}

function AdminList() {
  const router = useRouter();
  const [items, setItems] = useState<QuizSummary[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    stake: 100,
    reward: 250,
    passMark: 70,
  });

  function load() {
    return api<{ items: QuizSummary[] }>("/quizzes/manage").then((body) =>
      setItems(body.items),
    );
  }

  useEffect(() => {
    load().catch((caught) =>
      setError(apiErrorMessage(caught, "Could not load quizzes")),
    );
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const created = await api<QuizSummary>("/quizzes", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          stake: Number(form.stake),
          reward: Number(form.reward),
          passMark: Number(form.passMark),
        }),
      });
      router.push(`/admin/quizzes/${created.id}`);
    } catch (caught) {
      setError(apiErrorMessage(caught, "Could not create the quiz"));
      setPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="page-header">
        <p className="label">Admin</p>
        <h1 className="page-title">Quizzes</h1>
      </header>
      <form onSubmit={onSubmit} className="panel grid gap-4 p-5 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="label">Title</span>
          <input
            className="field"
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
            required
            minLength={3}
          />
        </label>
        <label className="block md:col-span-2">
          <span className="label">Description</span>
          <textarea
            className="field min-h-24"
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            required
          />
        </label>
        <NumberField
          label="Stake"
          value={form.stake}
          onChange={(stake) => setForm({ ...form, stake })}
        />
        <NumberField
          label="Reward"
          value={form.reward}
          onChange={(reward) => setForm({ ...form, reward })}
        />
        <NumberField
          label="Pass mark"
          value={form.passMark}
          onChange={(passMark) => setForm({ ...form, passMark })}
        />
        <div className="flex items-end">
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create draft"}
          </button>
        </div>
        {error && <p className="alert-error md:col-span-2">{error}</p>}
      </form>
      <ul className="list-panel divide-y divide-line">
        {items.map((quiz) => (
          <li
            key={quiz.id}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <div>
              <p className="font-semibold">{quiz.title}</p>
              <p className="text-moss">
                {quiz.published ? "Published" : "Draft"} · {quiz.questionCount}{" "}
                questions · stake {quiz.stake}
              </p>
            </div>
            <Link className="link-accent" href={`/admin/quizzes/${quiz.id}`}>
              Edit
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        className="field"
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        required
      />
    </label>
  );
}
