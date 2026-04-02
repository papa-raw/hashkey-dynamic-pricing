'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, RefreshCw, Loader2, ExternalLink, Copy, Check, ArrowRight, Info } from 'lucide-react';
import { Tooltip } from '@/components/Tooltip';
import { EXPLORER_URL, truncateAddress } from '@/lib/constants';
import Link from 'next/link';

const ease = [0.16, 1, 0.3, 1] as const;

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="text-pp-tertiary hover:text-pp-text transition-colors">
      {copied ? <Check className="w-3 h-3 text-pp-teal" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export default function AttestationsPage() {
  const [attestations, setAttestations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { const r = await fetch('/api/attestation'); const d = await r.json(); setAttestations(d.attestations || []); }
    catch {} finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 max-w-[1100px]">
      {/* Explainer */}
      <div className="bg-pp-blue-sub/20 border border-pp-blue/10 rounded-lg px-4 py-3 mb-5">
        <p className="text-xs text-pp-secondary leading-relaxed">
          <span className="text-pp-blue-hover font-medium">Price proofs</span> are onchain attestations created after every Dynamic Checkout payment.
          Each proof records the <span className="text-pp-text">Base</span> price (merchant's original amount),
          the <span className="text-pp-amount">Final</span> price (after oracle adjustment),
          and the <span className="text-pp-green">Discount</span> applied.
          The discount is determined by whichever pricing rule matched best — gas congestion, wallet loyalty, time of day, or jurisdiction.
          Every proof is permanently verifiable on HashKey Chain Explorer.
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-head text-xl font-semibold text-pp-text">Price Proofs</h1>
          <p className="text-xs text-pp-tertiary mt-0.5">Onchain attestation for every payment</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-pp-tertiary">{attestations.length} proofs</span>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 text-xs text-pp-secondary hover:text-pp-text transition-colors">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && attestations.length === 0 && (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 text-pp-tertiary animate-spin" /></div>
      )}

      {/* Empty — show table header so it signals "data goes here" */}
      {!loading && attestations.length === 0 && (
        <div className="border border-pp-border-sub rounded-xl overflow-hidden">
          <div className="grid grid-cols-[minmax(120px,1fr)_70px_24px_70px_minmax(200px,2fr)_70px_50px_28px] bg-pp-raised/40 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest text-pp-tertiary border-b border-pp-border-sub gap-x-2">
            <span>Proof ID</span><span>Base</span><span></span><span>Final</span><span>Why this price</span><span>Payer</span><span>Block</span><span></span>
          </div>
          <div className="text-center py-14">
            <Shield className="w-7 h-7 text-pp-tertiary mx-auto mb-2.5" />
            <p className="text-sm text-pp-secondary">No attestations yet</p>
            <p className="text-xs text-pp-tertiary mt-1 mb-4">Complete a payment to create the first price proof.</p>
            <Link href="/checkout" className="text-xs font-medium text-pp-blue hover:text-pp-blue-hover transition-colors">
              Go to Checkout &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Table — EAS Scan inspired */}
      {attestations.length > 0 && (
        <div className="border border-pp-border-sub rounded-xl overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[minmax(120px,1fr)_70px_24px_70px_minmax(200px,2fr)_70px_50px_28px] bg-pp-raised/40 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest text-pp-tertiary border-b border-pp-border-sub gap-x-2">
            <span>Proof ID</span>
            <span>Base</span>
            <span></span>
            <span>Final</span>
            <span>Why this price</span>
            <span>Payer</span>
            <span>Block</span>
            <span></span>
          </div>

          {/* Rows */}
          {attestations.map((a, i) => {
            const base = Number(a.basePrice) / 1e6;
            const final_ = Number(a.finalPrice) / 1e6;
            const saved = base - final_;
            const pct = base > 0 ? Math.round((saved / base) * 100) : 0;

            // Parse conditions to find the matched rule
            let matchedRule = '';
            let oracleValue = '';
            try {
              const conditions = JSON.parse(a.conditionsJson || '[]');
              // Find the condition with the largest discount (most negative adjustmentBps)
              const matchedConditions = conditions.filter((c: any) => c.matched);
              const best = matchedConditions.length > 0
                ? matchedConditions.reduce((a: any, b: any) => (a.adjustmentBps || 0) < (b.adjustmentBps || 0) ? a : b)
                : null;
              if (best) {
                matchedRule = best.rule?.label || best.rule?.conditionType || 'Rule matched';
                oracleValue = String(best.oracleValue ?? '');
              }
            } catch {}

            return (
              <motion.div
                key={a.proofId || i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className={`grid grid-cols-[minmax(120px,1fr)_70px_24px_70px_minmax(200px,2fr)_70px_50px_28px] px-4 py-3 items-center text-sm hover:bg-pp-raised/20 transition-colors border-b border-pp-border-sub last:border-0 gap-x-2 ${i === 0 ? 'attestation-new' : ''}`}
              >
                {/* Proof ID */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <Shield className="w-3 h-3 text-pp-teal flex-shrink-0" />
                  <span className="font-mono text-[11px] text-pp-secondary truncate">{truncateAddress(a.proofId, 8, 4)}</span>
                  <CopyBtn text={a.proofId} />
                </div>

                {/* Base */}
                <span className="font-mono text-[12px] text-pp-tertiary">${base.toFixed(2)}</span>

                {/* Arrow */}
                <ArrowRight className="w-3 h-3 text-pp-tertiary/40" />

                {/* Final */}
                <span className="font-mono text-[12px] text-pp-amount font-medium">${final_.toFixed(2)}</span>

                {/* Why — the reason for the price */}
                <div className="min-w-0">
                  {saved > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-pp-green bg-pp-green-sub border border-pp-green/15 px-1.5 py-0.5 rounded-md font-medium flex-shrink-0">
                        -{pct}%
                      </span>
                      <span className="text-[11px] text-pp-secondary truncate">{matchedRule || 'Rule matched'}</span>
                      {oracleValue && (
                        <span className="text-[10px] font-mono text-pp-tertiary flex-shrink-0">val={oracleValue}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-pp-tertiary">No conditions matched — full price paid</span>
                  )}
                </div>

                {/* Payer */}
                <span className="font-mono text-[11px] text-pp-tertiary">{truncateAddress(a.payer, 4, 3)}</span>

                {/* Block */}
                <span className="font-mono text-[11px] text-pp-tertiary tabular-nums">{a.blockNumber || '—'}</span>

                {/* Explorer link */}
                {a.txHash && (
                  <a href={`${EXPLORER_URL}/tx/${a.txHash}`} target="_blank" rel="noopener noreferrer"
                    className="text-pp-tertiary hover:text-pp-blue transition-colors">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
