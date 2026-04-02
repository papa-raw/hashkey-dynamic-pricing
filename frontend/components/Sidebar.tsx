'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Receipt, ShieldCheck, Activity, ExternalLink, Boxes, Workflow, Info, X as XIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { createPortal } from 'react-dom';
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

      {/* Info modal — rendered via portal to escape sidebar stacking context */}
      {showInfo && typeof document !== 'undefined' && createPortal(
        <>
        <div className="fixed inset-0 bg-[#0C1220] z-[9998]" onClick={() => setShowInfo(false)} />
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-8" onClick={() => setShowInfo(false)}>
          <div className="bg-[#1A2230] border border-pp-border rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 text-xs text-pp-secondary space-y-4 shadow-2xl ring-1 ring-white/5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Image src="/logo.svg" alt="Dynamic Checkout" width={20} height={24} />
                <span className="font-head text-base font-semibold text-pp-text">Dynamic Checkout</span>
              </div>
              <button onClick={() => setShowInfo(false)} className="text-pp-tertiary hover:text-pp-text transition-colors p-1"><XIcon className="w-4 h-4" /></button>
            </div>

            <p className="text-sm leading-relaxed text-pp-secondary">
              Oracle-conditioned payment middleware on HashKey Chain. Merchants define pricing rules tied to real-world data feeds. Every payment is dynamically priced and permanently attested onchain.
            </p>

            <div>
              <span className="text-pp-text font-medium text-sm block mb-2">How it works</span>
              <ol className="space-y-1.5 text-pp-secondary">
                <li className="flex gap-2"><span className="font-mono text-pp-tertiary w-4 flex-shrink-0">1</span> Customer connects wallet at checkout</li>
                <li className="flex gap-2"><span className="font-mono text-pp-tertiary w-4 flex-shrink-0">2</span> Astral Protocol creates a cryptographic location proof (EIP-712 via EAS)</li>
                <li className="flex gap-2"><span className="font-mono text-pp-tertiary w-4 flex-shrink-0">3</span> Four oracle feeds evaluate: gas price, wallet reputation, local time, jurisdiction</li>
                <li className="flex gap-2"><span className="font-mono text-pp-tertiary w-4 flex-shrink-0">4</span> Rule engine applies best discount or stacks all (merchant configurable)</li>
                <li className="flex gap-2"><span className="font-mono text-pp-tertiary w-4 flex-shrink-0">5</span> HSP settles USDC payment on HashKey Chain</li>
                <li className="flex gap-2"><span className="font-mono text-pp-teal w-4 flex-shrink-0">6</span> <span className="text-pp-teal">Price proof attested onchain with full computation record</span></li>
              </ol>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-pp-raised/40 rounded-lg p-3">
                <span className="text-pp-text font-medium block mb-1.5">Oracle Feeds</span>
                <ul className="space-y-1 text-pp-tertiary text-[11px]">
                  <li><span className="text-pp-secondary">Gas Price</span> — block.basefee</li>
                  <li><span className="text-pp-secondary">Loyalty</span> — prior payments</li>
                  <li><span className="text-pp-secondary">Time of Day</span> — client local hour</li>
                  <li><span className="text-pp-secondary">Jurisdiction</span> — TEE geofence</li>
                </ul>
              </div>
              <div className="bg-pp-raised/40 rounded-lg p-3">
                <span className="text-pp-text font-medium block mb-1.5">Tech Stack</span>
                <ul className="space-y-1 text-pp-tertiary text-[11px]">
                  <li>Solidity 0.8.20 · Hardhat</li>
                  <li>Next.js 15 · React 19 · Tailwind</li>
                  <li>wagmi · RainbowKit · viem</li>
                  <li>Astral SDK · EAS</li>
                </ul>
              </div>
            </div>

            <div className="bg-pp-teal-sub/20 border border-pp-teal/15 rounded-lg p-3">
              <span className="text-pp-teal font-medium block mb-1.5">Astral Protocol — TEE Location Verification</span>
              <p className="text-pp-secondary leading-relaxed">
                At checkout, browser GPS is collected and submitted as a signed stamp to Astral's <span className="text-pp-text">TEE verification API</span> (<span className="font-mono text-[10px]">staging-api.astral.global/verify/v0/proof</span>). The TEE evaluates stamp signatures, structural integrity, and temporal consistency, then returns a credibility-scored EAS attestation signed by Astral's TEE key — not the user's wallet.
              </p>
              <p className="text-pp-secondary leading-relaxed mt-2">
                Currently submitting one stamp per verification. Production would add multiple independent sources (ProofMode hardware attestation, WitnessChain network triangulation) for higher-confidence cross-correlation. The TEE verifies internal consistency of what's submitted — it can't independently confirm physical presence from a single browser GPS stamp.
              </p>
              <p className="text-pp-teal text-[10px] mt-2 font-medium">Evaluation method: astral-v0.3.0-tee</p>
            </div>

            <div>
              <span className="text-pp-text font-medium block mb-1.5">HSP (HashKey Settlement Protocol)</span>
              <p className="text-pp-tertiary leading-relaxed">
                Payment settlement uses HSP's REST API with dual auth: HMAC-SHA256 request signing and ES256K JWT merchant authorization (secp256k1 over cart hash). Payments settle in USDC on HashKey Chain. The checkout creates an order, the customer approves on HSP's page, and a webhook confirms settlement.
              </p>
            </div>

            <div>
              <span className="text-pp-text font-medium block mb-1.5">Price Attestations</span>
              <p className="text-pp-tertiary leading-relaxed">
                Every payment creates an onchain record: base price, final price, which conditions were evaluated, what oracle values were returned, and which rule determined the discount. A permanent, auditable proof of why every price was what it was.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-pp-border-sub">
              <a href="https://github.com/papa-raw/hashkey-dynamic-pricing" target="_blank" rel="noopener noreferrer" className="text-pp-blue hover:text-pp-blue-hover transition-colors flex items-center gap-1 text-xs">
                GitHub <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <a href="https://dynamic-checkout-mu.vercel.app" target="_blank" rel="noopener noreferrer" className="text-pp-blue hover:text-pp-blue-hover transition-colors flex items-center gap-1 text-xs">
                Live Demo <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <span className="text-pp-tertiary text-[10px] ml-auto">PayFi Track · HashKey Chain Horizon Hackathon</span>
            </div>
          </div>
        </div>
        </>,
        document.body
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
