import { THEME_STORAGE_KEY } from '@/lib/theme';

/** Applies saved theme before paint to avoid a flash of the wrong scheme. */
export function ThemeInitScript() {
  const script = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
