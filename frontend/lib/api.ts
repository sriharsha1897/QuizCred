import { clearSession, readToken } from './session';

export class ApiError extends Error {
  statusCode: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.statusCode = status;
    this.code = code;
  }
}

const FALLBACK_BY_CODE: Record<string, string> = {
  UNAUTHORIZED: 'Sign in to continue',
  FORBIDDEN: 'You do not have access to this resource',
  VALIDATION_ERROR: 'Check the form and try again',
  EMAIL_TAKEN: 'An account with this email already exists',
  INVALID_CREDENTIALS: 'Email or password is incorrect',
  INVALID_PASSWORD: 'Current password is incorrect',
  INSUFFICIENT_CREDITS: 'You do not have enough credits for this action',
  ALREADY_SETTLED: 'This attempt has already been submitted',
  QUIZ_NOT_FOUND: 'That quiz is not available',
  INTERNAL_ERROR: 'Something went wrong. Try again in a moment.',
};

export function apiErrorMessage(caught: unknown, fallback = 'Something went wrong'): string {
  if (caught instanceof ApiError) {
    return caught.message || FALLBACK_BY_CODE[caught.code] || fallback;
  }
  if (caught instanceof Error && caught.message.trim()) {
    return caught.message;
  }
  return fallback;
}

export function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = readToken();
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${apiBase()}${path}`, { ...init, headers, cache: 'no-store' });
  const body = (await response.json().catch(() => ({}))) as {
    statusCode?: number;
    code?: string;
    message?: string;
    data?: T;
  };

  if (response.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/register')) {
    clearSession();
    if (typeof window !== 'undefined') window.location.href = '/login';
  }

  if (!response.ok) {
    const code = body.code ?? 'HTTP_ERROR';
    const message =
      body.message?.trim() ||
      FALLBACK_BY_CODE[code] ||
      (response.status === 401
        ? 'Sign in to continue'
        : response.status === 403
          ? 'You do not have access to this resource'
          : 'Request failed');
    throw new ApiError(body.statusCode ?? response.status, code, message);
  }
  if (body.data !== undefined) {
    return body.data;
  }
  return body as T;
}
