'use client';

import { useId } from 'react';

/** Golden coin icon for credit amounts (compact UI). */
export function CreditCoin({ className = 'size-3.5' }: { className?: string }) {
  const gradientId = useId();
  return (
    <svg
      className={`inline-block shrink-0 text-amber-500 ${className}`}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <circle cx="10" cy="10" r="8.25" fill={`url(#${gradientId})`} stroke="#b45309" strokeWidth="1.25" />
      <circle cx="10" cy="10" r="5.5" stroke="#fcd34d" strokeWidth="0.75" opacity="0.85" />
      <path
        d="M10 6.2v7.6M7.4 8.1h5.2a1.6 1.6 0 0 1 0 3.2H7.4"
        stroke="#78350f"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <defs>
        <radialGradient id={gradientId} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="55%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function CreditAmount({
  value,
  className = '',
}: {
  value: number | null | undefined;
  className?: string;
}) {
  if (value === null || value === undefined) {
    return <span className={className}>—</span>;
  }
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} title="Credits">
      <span>{value}</span>
      <CreditCoin />
      <span className="sr-only"> credits</span>
    </span>
  );
}
