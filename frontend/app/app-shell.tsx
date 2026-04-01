'use client';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullBleed = pathname.startsWith('/checkout');

  if (isFullBleed) return <>{children}</>;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-11 border-b border-pp-border-sub bg-pp-bg/80 backdrop-blur-sm flex items-center justify-end gap-3 px-5 sticky top-0 z-40">
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-1.5 h-1.5 rounded-full bg-pp-green" />
            <span className="text-[10px] font-mono text-pp-tertiary">Testnet / 133</span>
          </div>
          <div className="scale-[0.8] origin-right">
            <ConnectButton />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
