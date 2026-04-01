'use client';
import { Zap, Clock, Award, MapPin } from 'lucide-react';
import type { OracleData } from '@/lib/types';

const CONFIG: Record<string, { icon: typeof Zap; color: string }> = {
  gas:        { icon: Zap,    color: 'text-pp-orange' },
  reputation: { icon: Award,  color: 'text-pp-blue-hover' },
  time:       { icon: Clock,  color: 'text-pp-amount' },
  location:   { icon: MapPin, color: 'text-pp-teal' },
};

export function OracleRibbon({ data }: { data: OracleData[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {data.map((d) => {
        const cfg = CONFIG[d.type] || CONFIG.gas;
        const Icon = cfg.icon;
        return (
          <div key={d.type} className="flex-shrink-0 flex items-center gap-2 bg-pp-surface border border-pp-border-sub rounded-lg px-3 py-2 min-w-[140px]">
            <Icon className={`w-3.5 h-3.5 ${cfg.color} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-pp-tertiary block">{d.type}</span>
              <span className="text-xs font-mono text-pp-text tabular-nums">{d.label}</span>
            </div>
            <div className="oracle-dot flex-shrink-0" />
          </div>
        );
      })}
    </div>
  );
}
