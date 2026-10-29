type SpinnerProps = {
  size?: 'sm' | 'md';
  className?: string;
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const dim = size === 'sm' ? 'h-5 w-5 border-2' : 'h-9 w-9 border-[3px]';
  return (
    <span
      className={`inline-block animate-spin rounded-full border-teal border-t-transparent ${dim} ${className}`}
      aria-hidden="true"
    />
  );
}

type PageLoaderProps = {
  label?: string;
  padded?: boolean;
};

export function PageLoader({ label, padded = false }: PageLoaderProps) {
  const statusLabel = label ?? 'Loading';
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${padded ? 'min-h-[40vh] p-8' : 'py-10'}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={statusLabel}
    >
      <Spinner />
      {label ? <p className="text-sm text-moss">{label}</p> : null}
    </div>
  );
}
