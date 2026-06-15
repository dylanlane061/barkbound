import type { Metadata } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import TopBar from '@/components/kit/TopBar';

// Display (headings, scores, numbers), body (UI), and mono (small numeric/meta).
// Geist Sans/Mono come from Vercel's `geist` package (not yet in this Next
// version's bundled Google-font list); Bricolage is a variable Google font.
// Each is exposed as a CSS variable that globals.css wires into
// --f-display / --f-body / --f-mono.
const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'Barkbound',
  description: 'Build better adventures with your dogs.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${GeistSans.variable} ${GeistMono.variable}`}>
        <TopBar />
        {children}
      </body>
    </html>
  );
}
