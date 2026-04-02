'use client';
import type { PriceRule } from '@/lib/types';
import { Plus, Trash2, Zap, Clock, Award, MapPin, SlidersHorizontal } from 'lucide-react';

const JURISDICTIONS = [
  { code: 1, name: 'Hong Kong' },
  { code: 2, name: 'Singapore' },
  { code: 3, name: 'Tokyo' },
  { code: 4, name: 'London' },
  { code: 5, name: 'New York' },
  { code: 6, name: 'Berlin' },
  { code: 0, name: 'Global (any)' },
];

const CONDITIONS = [
  { value: 'gas', label: 'Gas Price', unit: 'gwei', icon: Zap },
  { value: 'reputation', label: 'Wallet Rep', unit: 'txns', icon: Award },
  { value: 'time', label: 'Time of Day', unit: 'hour', icon: Clock },
  { value: 'location', label: 'Jurisdiction', unit: '', icon: MapPin },
] as const;

const OPERATORS = [
  { value: 'lt', label: '<' },
  { value: 'gt', label: '>' },
  { value: 'eq', label: '=' },
  { value: 'between', label: '↔' },
] as const;

const selectClass = 'bg-pp-bg border border-pp-border rounded-lg px-2.5 py-1.5 text-sm text-pp-text focus:outline-none focus:border-pp-blue transition-colors [&]:bg-pp-bg [color-scheme:dark]';
const inputClass = 'bg-pp-bg border border-pp-border rounded-lg px-2.5 py-1.5 text-sm text-pp-text font-mono w-20 focus:outline-none focus:border-pp-blue transition-colors tabular-nums [&]:select-all';
const selectOnFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

export function RuleEditor({ rules, onRulesChange }: { rules: PriceRule[]; onRulesChange: (r: PriceRule[]) => void }) {
  function add() {
    onRulesChange([...rules, { id: Date.now(), conditionType: 'gas', operator: 'lt', threshold: 10, adjustmentBps: -2000, label: 'New rule', active: true }]);
  }

  function remove(i: number) { onRulesChange(rules.filter((_, idx) => idx !== i)); }
  function update(i: number, u: Partial<PriceRule>) { onRulesChange(rules.map((r, idx) => idx === i ? { ...r, ...u } : r)); }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-pp-blue" />
          <h3 className="text-sm font-semibold text-pp-text">Pricing Rules</h3>
          <span className="text-[11px] text-pp-tertiary bg-pp-raised px-2 py-0.5 rounded-md">{rules.length}</span>
        </div>
        <button onClick={add} className="flex items-center gap-1.5 text-sm font-medium text-pp-blue hover:text-pp-blue-hover transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      <div className="space-y-2">
        {rules.map((rule, i) => {
          const cond = CONDITIONS.find(c => c.value === rule.conditionType);
          const Icon = cond?.icon || Zap;
          return (
            <div key={rule.id} className="group flex items-center gap-2 p-3 rounded-xl border border-pp-border-sub bg-pp-surface hover:border-pp-border transition-all">
              <div className="w-7 h-7 rounded-lg bg-pp-raised flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-pp-secondary" />
              </div>

              <select value={rule.conditionType} onChange={e => update(i, { conditionType: e.target.value as PriceRule['conditionType'] })} className={selectClass}>
                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>

              <select value={rule.operator} onChange={e => update(i, { operator: e.target.value as PriceRule['operator'] })} className={`${selectClass} w-14 text-center`}>
                {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              {rule.conditionType === 'location' ? (
                <select value={rule.threshold} onChange={e => update(i, { threshold: Number(e.target.value) })} className={selectClass}>
                  {JURISDICTIONS.map(j => <option key={j.code} value={j.code}>{j.name}</option>)}
                </select>
              ) : (
                <div className="flex items-center gap-1">
                  <input type="number" value={rule.threshold} onChange={e => update(i, { threshold: Number(e.target.value) })} onFocus={selectOnFocus} className={inputClass} />
                  {cond?.unit && <span className="text-[10px] text-pp-tertiary">{cond.unit}</span>}
                </div>
              )}

              {rule.operator === 'between' && (
                <>
                  <span className="text-xs text-pp-tertiary">to</span>
                  <input type="number" value={rule.thresholdHigh || 0} onChange={e => update(i, { thresholdHigh: Number(e.target.value) })} onFocus={selectOnFocus} className={inputClass} />
                </>
              )}

              <input value={rule.label} onChange={e => update(i, { label: e.target.value })} className="flex-1 min-w-0 bg-transparent border-0 text-sm text-pp-secondary focus:text-pp-text focus:outline-none placeholder:text-pp-tertiary" placeholder="Rule name..." />

              <div className="flex items-center gap-1 flex-shrink-0">
                <input type="number" value={rule.adjustmentBps / -100} onChange={e => update(i, { adjustmentBps: Number(e.target.value) * -100 })} onFocus={selectOnFocus} className={`${inputClass} w-14`} />
                <span className="text-[11px] text-pp-tertiary">% off</span>
              </div>

              <button onClick={() => remove(i)} className="opacity-0 group-hover:opacity-100 text-pp-tertiary hover:text-pp-red transition-all p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
