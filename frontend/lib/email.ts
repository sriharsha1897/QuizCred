export const EMAIL_MAX_LENGTH = 200;

const EMAIL_FORMAT =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validateEmail(value: string): string | null {
  const email = normalizeEmail(value);
  if (!email) return 'Email is required';
  if (email.length > EMAIL_MAX_LENGTH) {
    return `Email must be at most ${EMAIL_MAX_LENGTH} characters`;
  }
  if (email.includes('..') || email.startsWith('.') || email.includes('@.')) {
    return 'Enter a valid email address';
  }
  const at = email.indexOf('@');
  if (at <= 0 || at !== email.lastIndexOf('@')) {
    return 'Enter a valid email address';
  }
  const domain = email.slice(at + 1);
  if (!domain || domain.startsWith('-') || domain.endsWith('-')) {
    return 'Enter a valid email address';
  }
  if (!EMAIL_FORMAT.test(email)) {
    return 'Enter a valid email address';
  }
  return null;
}
