'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RuleEditor } from '@/components/RuleEditor';
import { ArrowUpRight, Info, Zap, Clock, Award, MapPin } from 'lucide-react';
import type { PriceRule } from '@/lib/types';
import Link from 'next/link';
import { Tooltip } from '@/components/Tooltip';

const ease = [0.16, 1, 0.3, 1] as const;

const DEFAULT_RULES: PriceRule[] = [
  { id: 1, conditionType: 'gas', operator: 'lt', threshold: 10, adjustmentBps: -3000, label: 'Low congestion: 30% off', active: true },
  { id: 2, conditionType: 'reputation', operator: 'gt', threshold: 50, adjustmentBps: -2000, label: 'Loyalty (50+ txns): 20% off', active: true },
  { id: 3, conditionType: 'time', operator: 'between', threshold: 0, thresholdHigh: 6, adjustmentBps: -5000, label: 'Off-peak (midnight-6am): 50% off', active: true },
  { id: 4, conditionType: 'location', operator: 'eq', threshold: 1, adjustmentBps: -1000, label: 'HK jurisdiction: 10% off', active: true },
];

const FEEDS = [
  { icon: Zap, label: 'Gas Price', desc: 'block.basefee', tip: 'Reads network congestion from the latest block — low gas triggers discounts' },
  { icon: Award, label: 'Wallet Rep', desc: 'tx count', tip: 'Transaction history on HashKey Chain — loyalty rewards for active wallets' },
  { icon: Clock, label: 'Time Zone', desc: 'local hour', tip: 'Local hour derived from Astral location proof — enables off-peak pricing' },
  { icon: MapPin, label: 'Jurisdiction', desc: 'geofence', tip: 'Astral Protocol location proof → geofence lookup → jurisdiction-specific rules' },
];

export default function DashboardPage() {
  const [rules, setRules] = useState<PriceRule[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dc-rules');
      if (saved) try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_RULES;
  });
  const [stackingMode, setStackingMode] = useState<'best' | 'stack'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('dc-stacking') as 'best' | 'stack') || 'best';
    return 'best';
  });
  const [proofCount, setProofCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/attestation').then(r => r.json()).then(d => setProofCount(d.attestations?.length ?? 0)).catch(() => {});
  }, []);

  function handleRulesChange(newRules: PriceRule[]) {
    setRules(newRules);
    localStorage.setItem('dc-rules', JSON.stringify(newRules));
  }

  function handleStackingChange(mode: 'best' | 'stack') {
    setStackingMode(mode);
    localStorage.setItem('dc-stacking', mode);
  }

  return (
    <div className="p-6 max-w-[960px]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ease }} className="mb-6">
        <h1 className="font-head text-lg font-semibold text-pp-text">Merchant Dashboard</h1>
        <p className="text-xs text-pp-tertiary mt-0.5">Oracle-conditioned pricing. Every payment dynamically priced and attested onchain.</p>
      </motion.div>

      {/* KPI strip */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Active Rules', value: rules.filter(r => r.active).length.toString(), sub: 'merchant-defined', tip: 'Pricing rules that apply conditions from oracle feeds to dynamically adjust payment amounts' },
          { label: 'Oracle Feeds', value: '4', sub: 'gas · rep · time · geo', tip: 'Real-time data sources: gas price, wallet reputation, timezone, jurisdiction' },
          { label: 'Attestations', value: proofCount !== null ? proofCount.toString() : '—', sub: 'onchain proofs', tip: 'Each payment creates an onchain attestation proving exactly why the price was what it was' },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, ease }}
            className="border border-pp-border-sub rounded-lg px-4 py-3">
            <span className="text-[10px] font-medium uppercase tracking-widest text-pp-tertiary flex items-center gap-1">
              {m.label}
              <Tooltip content={m.tip}><Info className="w-3 h-3 text-pp-tertiary/50 hover:text-pp-secondary cursor-help transition-colors" /></Tooltip>
            </span>
            <p className="font-mono text-2xl font-bold text-pp-text mt-0.5 leading-none">{m.value}</p>
            <span className="text-[11px] text-pp-tertiary">{m.sub}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Pricing Rules + Oracle Feeds merged */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, ease }}>
        <div className="border border-pp-border-sub rounded-xl overflow-hidden">
          {/* Header with explanation */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-head text-lg font-semibold text-pp-text">Pricing Rules</h2>
                <p className="text-xs text-pp-tertiary mt-0.5">
                  Each rule ties a real-time oracle feed to a price adjustment. When a customer checks out,
                  all rules evaluate against live data — the best matching discount applies.
                </p>
              </div>
              <Link href="/checkout" className="flex items-center gap-2 bg-pp-blue hover:bg-pp-blue-hover text-white font-semibold text-sm px-6 py-3 rounded-lg transition-all duration-150 flex-shrink-0 ml-4">
                Checkout <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Oracle feeds — inline ribbon */}
            <div className="flex gap-2 mb-4">
              {FEEDS.map((f) => (
                <Tooltip key={f.label} content={f.tip}>
                  <div className="flex items-center gap-1.5 bg-pp-raised/40 border border-pp-border-sub rounded-md px-2.5 py-1.5 cursor-help">
                    <f.icon className="w-3 h-3 text-pp-tertiary" />
                    <span className="text-[11px] text-pp-secondary">{f.label}</span>
                    <span className="text-[10px] text-pp-tertiary font-mono">{f.desc}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-pp-green flex-shrink-0" />
                  </div>
                </Tooltip>
              ))}
            </div>

            {/* How it works — inline explainer */}
            <div className="bg-pp-blue-sub/30 border border-pp-blue/10 rounded-lg px-4 py-3 mb-4">
              <p className="text-xs text-pp-secondary leading-relaxed">
                <span className="text-pp-blue-hover font-medium">How it works:</span> A merchant sets rules like
                "30% off when gas {'<'} 10 gwei" or "20% off for wallets with 50+ transactions." At checkout,
                Dynamic Checkout queries each oracle feed, evaluates every rule, applies the best discount,
                settles via HSP, and records an onchain attestation proving the exact computation.
                <Tooltip content="HashKey Settlement Protocol — the payment rail that settles USDC on HashKey Chain">
                  <span className="text-pp-blue-hover cursor-help border-b border-dotted border-pp-blue/30 ml-1">What is HSP?</span>
                </Tooltip>
              </p>
            </div>
          </div>

          {/* Rule editor */}
          <div className="px-5 pb-5">
            {/* Stacking mode toggle */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-pp-border-sub">
              <span className="text-xs text-pp-tertiary">Discount mode:</span>
              <button
                onClick={() => handleStackingChange('best')}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all ${stackingMode === 'best' ? 'bg-pp-blue-sub text-pp-blue-hover font-medium' : 'text-pp-tertiary hover:text-pp-secondary'}`}
              >
                Best discount wins
              </button>
              <button
                onClick={() => handleStackingChange('stack')}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all ${stackingMode === 'stack' ? 'bg-pp-blue-sub text-pp-blue-hover font-medium' : 'text-pp-tertiary hover:text-pp-secondary'}`}
              >
                Stack all discounts
              </button>
              <Tooltip content={stackingMode === 'best' ? 'Only the single largest discount applies to each payment' : 'All matching discounts are added together (capped at 100%)'}>
                <Info className="w-3 h-3 text-pp-tertiary/50 cursor-help" />
              </Tooltip>
            </div>

            <RuleEditor rules={rules} onRulesChange={handleRulesChange} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
