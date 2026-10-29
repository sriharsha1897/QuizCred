"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { api, apiErrorMessage } from "@/lib/api";
import { ManagedQuestion, QuizSummary } from "@/lib/types";

type ManagedQuiz = QuizSummary & { questions: ManagedQuestion[] };

export default function AdminQuizPage() {
  return (
    <AuthGate admin>
      <Editor />
    </AuthGate>
  );
}

function Editor() {
  const params = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<ManagedQuiz | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [question, setQuestion] = useState({
    prompt: "",
    options: ["", "", "", ""],
    correctIndex: 0,
  });

  function load() {
    return api<ManagedQuiz>(`/quizzes/${params.id}/manage`).then(setQuiz);
  }

  useEffect(() => {
    load().catch((caught) =>
      setError(apiErrorMessage(caught, "Could not load this quiz")),
    );
  }, [params.id]);

  async function saveQuiz(event: FormEvent) {
    event.preventDefault();
    if (!quiz) return;
    setError("");
    try {
      await api(`/quizzes/${quiz.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: quiz.title,
          description: quiz.description,
          stake: Number(quiz.stake),
          reward: Number(quiz.reward),
          passMark: Number(quiz.passMark),
        }),
      });
      setNotice("Quiz saved.");
      await load();
    } catch (caught) {
      setError(apiErrorMessage(caught, "Could not save"));
    }
  }

  async function addQuestion(event: FormEvent) {
    event.preventDefault();
    if (!quiz) return;
    setError("");
    try {
      const order =
        quiz.questions.reduce((max, item) => Math.max(max, item.order), 0) + 1;
      await api(`/quizzes/${quiz.id}/questions`, {
        method: "POST",
        body: JSON.stringify({
          prompt: question.prompt,
          options: question.options,
          correctIndex: Number(question.correctIndex),
          order,
        }),
      });
      setQuestion({ prompt: "", options: ["", "", "", ""], correctIndex: 0 });
      setNotice("Question added.");
      await load();
    } catch (caught) {
      setError(apiErrorMessage(caught, "Could not add the question"));
    }
  }

  async function publish(next: boolean) {
    if (!quiz) return;
    setError("");
    try {
      await api(`/quizzes/${quiz.id}/${next ? "publish" : "unpublish"}`, {
        method: "POST",
      });
      setNotice(next ? "Quiz published." : "Quiz unpublished.");
      await load();
    } catch (caught) {
      setError(apiErrorMessage(caught, "Could not change publication"));
    }
  }

  async function removeQuestion(id: string) {
    setError("");
    try {
      await api(`/questions/${id}`, { method: "DELETE" });
      setNotice("Question deleted.");
      await load();
    } catch (caught) {
      setError(apiErrorMessage(caught, "Could not delete the question"));
    }
  }

  if (!quiz && !error)
    return <p className="text-sm text-moss">Loading editor…</p>;
  if (!quiz) return <p className="alert-error">{error}</p>;

  return (
    <div className="space-y-6">
      <Link href="/admin/quizzes" className="link-accent text-sm">
        All quizzes
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-4xl tracking-tight">
          {quiz.published ? "Published" : "Draft"}
        </h1>
        <button
          className="btn-ghost"
          type="button"
          onClick={() => publish(!quiz.published)}
        >
          {quiz.published ? "Unpublish" : "Publish"}
        </button>
      </div>
      {notice && <p className="text-sm text-teal">{notice}</p>}
      {error && <p className="alert-error">{error}</p>}
      <form onSubmit={saveQuiz} className="panel grid gap-4 p-5 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="label">Title</span>
          <input
            className="field"
            value={quiz.title}
            onChange={(event) =>
              setQuiz({ ...quiz, title: event.target.value })
            }
          />
        </label>
        <label className="block md:col-span-2">
          <span className="label">Description</span>
          <textarea
            className="field min-h-24"
            value={quiz.description}
            onChange={(event) =>
              setQuiz({ ...quiz, description: event.target.value })
            }
          />
        </label>
        <label className="block">
          <span className="label">Stake</span>
          <input
            className="field"
            type="number"
            value={quiz.stake}
            onChange={(event) =>
              setQuiz({ ...quiz, stake: Number(event.target.value) })
            }
          />
        </label>
        <label className="block">
          <span className="label">Reward</span>
          <input
            className="field"
            type="number"
            value={quiz.reward}
            onChange={(event) =>
              setQuiz({ ...quiz, reward: Number(event.target.value) })
            }
          />
        </label>
        <label className="block">
          <span className="label">Pass mark</span>
          <input
            className="field"
            type="number"
            value={quiz.passMark}
            onChange={(event) =>
              setQuiz({ ...quiz, passMark: Number(event.target.value) })
            }
          />
        </label>
        <div className="flex items-end">
          <button className="btn" type="submit">
            Save quiz
          </button>
        </div>
      </form>
      <section className="space-y-3">
        <h2 className="font-serif text-2xl">Questions</h2>
        {quiz.questions.map((item) => (
          <article
            key={item.id}
            className="panel flex items-start justify-between gap-3 p-4 text-sm"
          >
            <div>
              <p className="font-semibold">
                {item.order}. {item.prompt}
              </p>
              <p className="mt-1 text-moss">
                {item.options.join(" · ")} · correct{" "}
                {item.options[item.correctIndex]}
              </p>
            </div>
            <button
              className="btn-danger"
              type="button"
              onClick={() => removeQuestion(item.id)}
            >
              Delete
            </button>
          </article>
        ))}
      </section>
      <form onSubmit={addQuestion} className="panel space-y-4 p-5">
        <h2 className="font-serif text-2xl">Add a question</h2>
        <label className="block">
          <span className="label">Prompt</span>
          <input
            className="field"
            value={question.prompt}
            onChange={(event) =>
              setQuestion({ ...question, prompt: event.target.value })
            }
            required
            minLength={3}
          />
        </label>
        {question.options.map((option, index) => (
          <label key={index} className="block">
            <span className="label">Option {index + 1}</span>
            <input
              className="field"
              value={option}
              required
              onChange={(event) => {
                const options = [...question.options];
                options[index] = event.target.value;
                setQuestion({ ...question, options });
              }}
            />
          </label>
        ))}
        <label className="block">
          <span className="label">Correct option</span>
          <select
            className="field"
            value={question.correctIndex}
            onChange={(event) =>
              setQuestion({
                ...question,
                correctIndex: Number(event.target.value),
              })
            }
          >
            {question.options.map((_, index) => (
              <option key={index} value={index}>
                Option {index + 1}
              </option>
            ))}
          </select>
        </label>
        <button className="btn" type="submit">
          Add question
        </button>
      </form>
    </div>
  );
}
