export const EMAIL_MAX_LENGTH = 200;

/** Practical format check: local@domain.tld (e.g. user@quiz.com). */
const EMAIL_FORMAT =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmailFormat(value: string): boolean {
  const email = normalizeEmail(value);
  if (!email || email.length > EMAIL_MAX_LENGTH) return false;
  if (email.includes('..') || email.startsWith('.') || email.includes('@.')) return false;
  const at = email.indexOf('@');
  if (at <= 0 || at !== email.lastIndexOf('@')) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!local || !domain || domain.startsWith('-') || domain.endsWith('-')) return false;
  return EMAIL_FORMAT.test(email);
}
