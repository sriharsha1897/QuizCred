export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'quiz.theme';

export function readStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  return raw === 'dark' || raw === 'light' ? raw : null;
}

export function resolveTheme(): Theme {
  const stored = readStoredTheme();
  if (stored) return stored;
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

export function persistTheme(theme: Theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}
