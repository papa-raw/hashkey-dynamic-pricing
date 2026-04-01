'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Receipt, ShieldCheck, Activity, ExternalLink, Boxes, Workflow } from 'lucide-react';
import Image from 'next/image';
import { EXPLORER_URL, PROOFPAY_ATTESTATION_ADDRESS, HSP_ADAPTER_ADDRESS, RULE_REGISTRY_ADDRESS, truncateAddress } from '@/lib/constants';

const NAV = [
  { href: '/', label: 'Dashboard', icon: Activity },
  { href: '/checkout', label: 'Checkout', icon: Receipt },
  { href: '/attestations', label: 'Attestations', icon: ShieldCheck },
];

const CONTRACTS = [
  { name: 'Attestation', addr: PROOFPAY_ATTESTATION_ADDRESS },
  { name: 'HSPAdapter', addr: HSP_ADAPTER_ADDRESS },
  { name: 'RuleRegistry', addr: RULE_REGISTRY_ADDRESS },
];

const FLOW = [
  'Customer connects wallet',
  'Astral verifies location',
  'Oracles compute price',
  'HSP settles payment',
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] flex-shrink-0 border-r border-pp-border-sub bg-pp-bg flex flex-col h-screen sticky top-0">
      {/* Logo — no "HashKey Chain" subtitle */}
      <div className="px-5 py-4 border-b border-pp-border-sub">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="Dynamic Checkout" width={22} height={26} className="flex-shrink-0" />
          <span className="font-head text-sm font-semibold text-pp-text tracking-tight">Dynamic Checkout</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 py-4">
        <span className="text-[10px] font-medium uppercase tracking-widest text-pp-tertiary px-2 mb-2 block">Navigation</span>
        <div className="space-y-0.5 mt-2">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                  active ? 'bg-pp-blue-sub/60 text-pp-blue-hover font-medium' : 'text-pp-secondary hover:text-pp-text hover:bg-pp-raised/50'
                }`}>
                <item.icon className={`w-4 h-4 ${active ? 'text-pp-blue-hover' : 'text-pp-tertiary'}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Contracts */}
      <div className="px-4 py-3 border-t border-pp-border-sub">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Boxes className="w-3 h-3 text-pp-tertiary" />
          <span className="text-[10px] font-medium uppercase tracking-widest text-pp-tertiary">Contracts</span>
        </div>
        <div className="space-y-1.5">
          {CONTRACTS.map((c) => (
            <a key={c.name} href={`${EXPLORER_URL}/address/${c.addr}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between text-[11px] hover:text-pp-blue transition-colors group">
              <span className="text-pp-secondary group-hover:text-pp-blue">{c.name}</span>
              <span className="font-mono text-pp-tertiary group-hover:text-pp-blue flex items-center gap-1">
                {truncateAddress(c.addr, 4, 3)}<ExternalLink className="w-2 h-2" />
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Flow */}
      <div className="px-4 py-3 border-t border-pp-border-sub mt-auto">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Workflow className="w-3 h-3 text-pp-tertiary" />
          <span className="text-[10px] font-medium uppercase tracking-widest text-pp-tertiary">Flow</span>
        </div>
        <ol className="space-y-1">
          {FLOW.map((step, i) => (
            <li key={i} className="flex gap-2 text-[11px] text-pp-tertiary">
              <span className="font-mono text-pp-tertiary/60 w-3 text-right flex-shrink-0">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
          <li className="flex gap-2 text-[11px] text-pp-teal">
            <span className="font-mono w-3 text-right flex-shrink-0">5</span>
            <span>Proof attested onchain</span>
          </li>
        </ol>
      </div>
    </aside>
  );
}
