'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Receipt, ShieldCheck, Activity, ExternalLink, Boxes, Workflow, Info, X as XIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
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
  const [showInfo, setShowInfo] = useState(false);

  return (
    <aside className="w-[220px] flex-shrink-0 border-r border-pp-border-sub bg-pp-bg flex flex-col h-screen sticky top-0">
      {/* Logo + info */}
      <div className="px-5 py-4 border-b border-pp-border-sub">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="Dynamic Checkout" width={22} height={26} className="flex-shrink-0" />
          <span className="font-head text-sm font-semibold text-pp-text tracking-tight flex-1">Dynamic Checkout</span>
          <button onClick={() => setShowInfo(!showInfo)} className="text-pp-tertiary hover:text-pp-secondary transition-colors">
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Info panel */}
      {showInfo && (
        <div className="px-4 py-3 border-b border-pp-border-sub bg-pp-surface/50 text-[11px] text-pp-secondary space-y-3 overflow-y-auto max-h-[60vh]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-widest text-pp-tertiary">About</span>
            <button onClick={() => setShowInfo(false)} className="text-pp-tertiary hover:text-pp-text"><XIcon className="w-3 h-3" /></button>
          </div>

          <p className="leading-relaxed">
            <span className="text-pp-text font-medium">Dynamic Checkout</span> is oracle-conditioned payment middleware on HashKey Chain. Merchants define pricing rules tied to real-world data feeds. Every payment is dynamically priced and permanently attested onchain.
          </p>

          <div>
            <span className="text-pp-text font-medium block mb-1">How it works</span>
            <ol className="space-y-1 text-pp-tertiary">
              <li>1. Customer connects wallet at checkout</li>
              <li>2. Astral Protocol creates a cryptographic location proof (EIP-712 via EAS)</li>
              <li>3. Four oracle feeds evaluate: gas price, wallet reputation, local time, jurisdiction</li>
              <li>4. Rule engine applies best discount (or stacks all)</li>
              <li>5. HSP settles USDC payment on HashKey Chain</li>
              <li>6. Price proof attested onchain with full computation record</li>
            </ol>
          </div>

          <div>
            <span className="text-pp-text font-medium block mb-1">Oracle Feeds</span>
            <ul className="space-y-0.5 text-pp-tertiary">
              <li><span className="text-pp-text">Gas Price</span> — reads block.basefee for network congestion</li>
              <li><span className="text-pp-text">Wallet Rep</span> — transaction count on HashKey Chain</li>
              <li><span className="text-pp-text">Time of Day</span> — local hour derived from Astral location proof</li>
              <li><span className="text-pp-text">Jurisdiction</span> — geofence lookup from GPS coordinates</li>
            </ul>
          </div>

          <div>
            <span className="text-pp-text font-medium block mb-1">Astral Protocol</span>
            <p className="text-pp-tertiary leading-relaxed">
              Location proofs use the Ethereum Attestation Service (EAS), pre-deployed on HashKey Chain at the OP Stack predeploy address. The Astral schema is registered natively on chain 133, enabling EIP-712 offchain attestations that cryptographically prove a customer's location at payment time.
            </p>
          </div>

          <div>
            <span className="text-pp-text font-medium block mb-1">HSP (HashKey Settlement Protocol)</span>
            <p className="text-pp-tertiary leading-relaxed">
              Payment settlement uses HSP's REST API with dual authentication: HMAC-SHA256 request signing and ES256K JWT merchant authorization. Payments settle in USDC on HashKey Chain. The checkout creates an order, the customer approves on HSP's page, and a webhook confirms settlement.
            </p>
          </div>

          <div>
            <span className="text-pp-text font-medium block mb-1">Price Attestations</span>
            <p className="text-pp-tertiary leading-relaxed">
              Every payment creates an onchain record in the ProofPayAttestation contract: base price, final price, which oracle conditions were evaluated, what values they returned, and which rule determined the discount. This creates a permanent, auditable proof of why every price was what it was.
            </p>
          </div>

          <div>
            <span className="text-pp-text font-medium block mb-1">Tech Stack</span>
            <ul className="space-y-0.5 text-pp-tertiary">
              <li>Solidity 0.8.20 · Hardhat · HashKey Chain (133)</li>
              <li>Next.js 15 · React 19 · Tailwind · Framer Motion</li>
              <li>wagmi v2 · RainbowKit · viem · ethers.js</li>
              <li>Astral SDK · EAS · patch-package</li>
            </ul>
          </div>

          <div className="pt-1">
            <a href="https://github.com/papa-raw/hashkey-dynamic-pricing" target="_blank" rel="noopener noreferrer" className="text-pp-blue hover:text-pp-blue-hover transition-colors flex items-center gap-1">
              GitHub <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      )}

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
