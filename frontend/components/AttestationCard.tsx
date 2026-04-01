'use client';
import { ExternalLink, Shield, Copy, Check } from 'lucide-react';
import { EXPLORER_URL, truncateAddress } from '@/lib/constants';
import { useState } from 'react';

interface Props {
  proof: {
    proofId: string; merchant: string; payer: string;
    basePrice: string; finalPrice: string; txHash?: string;
    blockNumber?: number; hspRequestId?: string;
  };
  isNew?: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="text-pp-tertiary hover:text-pp-text transition-colors p-0.5"
    >
      {copied ? <Check className="w-3 h-3 text-pp-teal" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export function AttestationCard({ proof, isNew }: Props) {
  const base = Number(proof.basePrice) / 1e6;
  const final = Number(proof.finalPrice) / 1e6;
  const saved = base - final;
  const txUrl = proof.txHash ? `${EXPLORER_URL}/tx/${proof.txHash}` : '#';

  return (
    <div className={`rounded-xl border border-pp-border bg-pp-surface p-5 hover:bg-pp-raised/30 transition-all duration-200 ${isNew ? 'attestation-new border-pp-teal/20' : ''}`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-pp-teal-sub flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-pp-teal" />
          </div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-pp-teal">Price Proof</span>
        </div>
        {proof.txHash && (
          <a href={txUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-pp-blue hover:text-pp-blue-hover transition-colors">
            <span className="font-mono">{truncateAddress(proof.txHash, 6, 4)}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Amounts grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <span className="text-[11px] text-pp-tertiary uppercase tracking-wider">Base</span>
          <p className="font-mono text-sm font-medium text-pp-secondary mt-0.5 tabular-nums">${base.toFixed(2)}</p>
        </div>
        <div>
          <span className="text-[11px] text-pp-tertiary uppercase tracking-wider">Final</span>
          <p className="font-mono text-sm font-bold text-pp-amount mt-0.5 tabular-nums">${final.toFixed(2)}</p>
        </div>
        <div>
          <span className="text-[11px] text-pp-tertiary uppercase tracking-wider">Saved</span>
          <p className="font-mono text-sm font-medium text-pp-green mt-0.5 tabular-nums">${saved.toFixed(2)}</p>
        </div>
      </div>

      {/* Addresses */}
      <div className="space-y-1.5 pt-3 border-t border-pp-border-sub">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-pp-tertiary w-16">Merchant</span>
          <span className="font-mono text-[13px] text-pp-secondary">{truncateAddress(proof.merchant)}</span>
          <CopyButton text={proof.merchant} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-pp-tertiary w-16">Payer</span>
          <span className="font-mono text-[13px] text-pp-secondary">{truncateAddress(proof.payer)}</span>
          <CopyButton text={proof.payer} />
        </div>
      </div>
    </div>
  );
}
