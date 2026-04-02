'use client';
import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { PriceBreakdown } from '@/components/PriceBreakdown';
import { LocationProof } from '@/components/LocationProof';
import { OracleRibbon } from '@/components/OracleRibbon';
import { Loader2, ExternalLink, ArrowLeft, Info } from 'lucide-react';
import { Tooltip } from '@/components/Tooltip';
import Image from 'next/image';
import type { PriceResult, OracleData } from '@/lib/types';
import Link from 'next/link';

const ease = [0.16, 1, 0.3, 1] as const;

export default function CheckoutPage() {
  const { address, isConnected } = useAccount();
  const [basePrice] = useState(10);
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
  const [oracleData, setOracleData] = useState<OracleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const locationRef = useRef<{ uid: string; lat: number; lng: number } | null>(null);
  const priceRef = useRef<PriceResult | null>(null);

  const computePrice = useCallback(async (loc?: { uid: string; lat: number; lng: number }) => {
    setLoading(true);
    try {
      // Read merchant rules + stacking mode from localStorage (set by dashboard)
      let rules;
      try { rules = JSON.parse(localStorage.getItem('dc-rules') || 'null'); } catch {}
      const stackingMode = localStorage.getItem('dc-stacking') || 'best';

      const body: Record<string, unknown> = { walletAddress: address || '0x' + '0'.repeat(40), basePrice, stackingMode };
      if (loc) { body.lat = loc.lat; body.lng = loc.lng; }
      if (rules) { body.rules = rules; }
      const res = await fetch('/api/price', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      setPriceResult(data);
      priceRef.current = data;
      setOracleData(data.oracleData || []);
    } catch (err) { console.error('Price computation failed:', err); }
    finally { setLoading(false); }
  }, [address, basePrice]);

  const handleLocation = useCallback((proof: { uid: string; lat: number; lng: number }) => {
    locationRef.current = proof;
    computePrice(proof);
  }, [computePrice]);

  const handlePay = useCallback(async () => {
    if (!priceRef.current) return;
    setPaying(true);
    try {
      const res = await fetch('/api/pay', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address, basePrice: priceRef.current.basePrice, finalPrice: priceRef.current.finalPrice,
          conditions: priceRef.current.conditions,
          locationJson: locationRef.current ? JSON.stringify({ lat: locationRef.current.lat, lng: locationRef.current.lng }) : '',
          astralProofUid: locationRef.current?.uid || '',
        }),
      });
      const data = await res.json();
      if (data.paymentUrl) {
        // Save payment details for attestation creation on success page
        localStorage.setItem('dc-last-payment', JSON.stringify({
          walletAddress: address,
          basePrice: priceRef.current!.basePrice,
          finalPrice: priceRef.current!.finalPrice,
          conditions: priceRef.current!.conditions,
          locationJson: locationRef.current ? JSON.stringify({ lat: locationRef.current.lat, lng: locationRef.current.lng }) : '',
          astralProofUid: locationRef.current?.uid || '',
        }));
        window.open(data.paymentUrl, '_blank');
      }
    } catch (err) { console.error('Payment failed:', err); }
    finally { setPaying(false); }
  }, [address]);

  return (
    <div className="min-h-screen bg-pp-bg">
      {/* Minimal checkout-only nav */}
      <nav className="border-b border-pp-border-sub bg-pp-bg/80 backdrop-blur-sm">
        <div className="max-w-[520px] mx-auto px-6 h-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-pp-tertiary hover:text-pp-text transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <Image src="/logo.svg" alt="Dynamic Checkout" width={18} height={21} />
            <span className="text-sm font-medium text-pp-secondary">Dynamic Checkout</span>
          </Link>
          <div className="scale-[0.8] origin-right"><ConnectButton /></div>
        </div>
      </nav>

      <div className="max-w-[520px] mx-auto px-6 py-10">
        {/* Two-column: left = form, right would be summary on wider (single col for 520px) */}
        <div className="space-y-5">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ease }}>
            <h1 className="font-head text-2xl font-bold text-pp-text">Checkout</h1>
            <p className="text-sm text-pp-tertiary mt-1">Your price is computed from 4 live oracle feeds</p>
          </motion.div>

          {/* Order card */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, ease }}
            className="border border-pp-border-sub rounded-xl overflow-hidden"
          >
            {/* Line item */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-pp-border-sub">
              <span className="text-sm text-pp-secondary">Base price</span>
              <span className="font-mono text-sm text-pp-text tabular-nums">${basePrice.toFixed(2)}</span>
            </div>
            {/* Oracle feeds inline */}
            <div className="px-5 py-3 border-b border-pp-border-sub bg-pp-surface/30">
              <div className="flex items-center gap-4 text-[11px] text-pp-tertiary">
                <Tooltip content="Real-time data sources that determine your dynamic price"><span className="uppercase tracking-widest font-medium cursor-help">Feeds</span></Tooltip>
                <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-pp-green" />Gas</span>
                <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-pp-green" />Reputation</span>
                <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-pp-green" />Time</span>
                <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-pp-green" />Location</span>
              </div>
            </div>
            {/* Total */}
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm font-medium text-pp-text">Total before adjustment</span>
              <span className="font-mono text-xl font-bold text-pp-text tabular-nums">${basePrice.toFixed(2)} <span className="text-xs font-normal text-pp-tertiary">USDC</span></span>
            </div>
          </motion.div>

          {/* Connect */}
          {!isConnected && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="border border-pp-border-sub rounded-xl p-6 text-center space-y-3"
            >
              <p className="text-sm text-pp-secondary">Connect your wallet for personalized pricing</p>
              <div className="flex justify-center"><ConnectButton /></div>
            </motion.div>
          )}

          {/* Location */}
          {isConnected && <LocationProof onProofCreated={handleLocation} />}

          {/* Compute */}
          {isConnected && !priceResult && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
              <button onClick={() => computePrice(locationRef.current || undefined)}
                className="w-full bg-pp-blue hover:bg-pp-blue-hover text-white font-semibold text-sm py-3 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pp-blue/50">
                Compute Dynamic Price
              </button>
            </motion.div>
          )}

          {/* Oracle data ribbon */}
          {oracleData.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <OracleRibbon data={oracleData} />
            </motion.div>
          )}

          {/* Price breakdown */}
          {(loading || priceResult) && <PriceBreakdown result={priceResult} loading={loading} />}

          {/* Pay */}
          {priceResult && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <button onClick={handlePay} disabled={paying}
                className="w-full bg-pp-text hover:bg-white text-pp-bg font-bold text-base py-3.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-40">
                {paying
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating order...</>
                  : <>Pay ${priceResult.finalPrice.toFixed(2)} USDC <ExternalLink className="w-4 h-4" /></>}
              </button>
              <p className="text-[10px] text-pp-tertiary text-center mt-2.5">
                Redirects to HSP checkout. Payment settled on HashKey Chain. Price proof attested onchain.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
