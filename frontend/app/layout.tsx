import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { AppShell } from './app-shell';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Dynamic Checkout — Oracle-Conditioned Payments',
  description: 'Dynamic pricing with onchain proof. Every price is provable on HashKey Chain.',
  openGraph: {
    title: 'Dynamic Checkout — Oracle-Conditioned Payments',
    description: 'Dynamic pricing tied to real-world oracle feeds. Every payment attested onchain.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
