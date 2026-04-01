'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, MapPin, Clock, Zap, Award, TrendingDown } from 'lucide-react';
import type { PriceResult } from '@/lib/types';
import { useEffect, useState } from 'react';

const ICONS = { gas: Zap, time: Clock, reputation: Award, location: MapPin } as const;
const JURISDICTIONS: Record<number, string> = { 0: 'Global', 1: 'Hong Kong', 2: 'Singapore', 3: 'Tokyo', 4: 'London', 5: 'New York', 6: 'Berlin' };

function formatOracleValue(type: string, value: number): string {
  switch (type) {
    case 'gas': return `${value.toFixed(2)} gwei`;
    case 'reputation': return `${value} txns`;
    case 'time': return `${value}:00 local`;
    case 'location': return JURISDICTIONS[value] || `zone ${value}`;
    default: return String(value);
  }
}
const ease = [0.16, 1, 0.3, 1] as const;

function AnimatedPrice({ value, className }: { value: number; className: string }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start = display;
    const delta = value - start;
    const duration = 800;
    const startTime = performance.now();
    function tick(now: number) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(start + delta * eased);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value]);
  return <span className={className}>${display.toFixed(2)}</span>;
}

export function PriceBreakdown({ result, loading }: { result: PriceResult | null; loading?: boolean }) {
  if (loading || !result) {
    return (
      <div className="rounded-xl border border-pp-border bg-pp-surface p-6">
        <div className="space-y-3">
          <div className="h-3 bg-pp-raised rounded-md w-24 animate-pulse" />
          <div className="h-9 bg-pp-raised rounded-md w-40 animate-pulse" />
          <div className="h-px bg-pp-border-sub my-4" />
          {[1,2,3,4].map(i => <div key={i} className="h-10 bg-pp-raised rounded-lg animate-pulse" style={{ animationDelay: `${i*80}ms` }} />)}
        </div>
      </div>
    );
  }

  const savings = result.basePrice - result.finalPrice;
  const pct = result.basePrice > 0 ? ((savings / result.basePrice) * 100).toFixed(0) : '0';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="rounded-xl border border-pp-border bg-pp-surface overflow-hidden"
    >
      {/* Price header */}
      <div className="p-6 pb-4">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-pp-tertiary">Dynamic Price</span>
          {savings > 0 && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 28 }}
              className="inline-flex items-center gap-1 text-xs font-medium text-pp-green bg-pp-green-sub border border-pp-green/20 px-2.5 py-1 rounded-md"
            >
              <TrendingDown className="w-3 h-3" />
              {pct}% off
            </motion.span>
          )}
        </div>

        <div className="flex items-baseline gap-3 mt-2">
          <AnimatedPrice value={result.finalPrice} className="font-mono text-[36px] font-bold text-pp-amount tabular-nums leading-none" />
          {savings > 0 && (
            <span className="font-mono text-lg text-pp-tertiary line-through tabular-nums">${result.basePrice.toFixed(2)}</span>
          )}
          <span className="text-xs text-pp-tertiary ml-1">USDC</span>
        </div>
      </div>

      {/* Conditions */}
      <div className="border-t border-pp-border-sub px-6 py-4">
        <span className="text-[11px] font-medium uppercase tracking-wider text-pp-tertiary">
          Conditions Evaluated
        </span>
        <div className="mt-3 space-y-1.5">
          {result.conditions.map((c, i) => {
            const Icon = ICONS[c.rule.conditionType as keyof typeof ICONS] || Zap;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06, duration: 0.35, ease }}
                className={`flex items-center gap-3 py-2 px-3 rounded-lg text-sm transition-colors ${
                  c.matched
                    ? 'bg-pp-teal-sub/30 text-pp-text border-l-2 border-pp-teal'
                    : 'bg-pp-raised/30 text-pp-tertiary'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${c.matched ? 'text-pp-teal' : 'text-pp-tertiary'}`} />
                <div className="flex-1 min-w-0">
                  <span className="truncate block">{c.rule.label}</span>
                  <span className="text-[11px] text-pp-tertiary">
                    Oracle: {formatOracleValue(c.rule.conditionType, c.oracleValue)}
                    {c.matched && <> — saves {(c.rule.adjustmentBps / -100).toFixed(0)}%</>}
                  </span>
                </div>
                {c.matched ? <Check className="w-3.5 h-3.5 text-pp-teal flex-shrink-0" /> : <X className="w-3.5 h-3.5 text-pp-tertiary/50 flex-shrink-0" />}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Best discount callout */}
      {result.bestDiscount && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mx-6 mb-5 bg-pp-blue-sub/50 border border-pp-blue/20 rounded-lg px-4 py-3 text-sm text-pp-blue-hover"
        >
          Best discount applied: <span className="font-medium text-pp-text">{result.bestDiscount.rule.label}</span>
          <span className="block text-xs text-pp-tertiary mt-1">
            ${result.basePrice.toFixed(2)} × {(result.bestDiscount.rule.adjustmentBps / -100).toFixed(0)}% off = ${result.finalPrice.toFixed(2)} USDC
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
