import type { Metadata } from 'next';
import { Figtree, Fraunces } from 'next/font/google';
import { APP_DESCRIPTION, APP_NAME } from '@/lib/brand';
import { ThemeInitScript } from '@/components/theme-init-script';
import './globals.css';

const sans = Figtree({ subsets: ['latin'], variable: '--font-sans' });
const serif = Fraunces({ subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${serif.variable}`}>
        <ThemeInitScript />
        {children}
      </body>
    </html>
  );
}
