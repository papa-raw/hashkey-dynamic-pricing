'use client';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Shield, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';

function Content() {
  const params = useSearchParams();
  const orderId = params.get('order');
  const [attestation, setAttestation] = useState<any>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    // Read payment details from URL params (set by /api/pay in the redirect URL)
    // This is reliable — doesn't depend on localStorage surviving the HSP redirect
    const paymentData = {
      walletAddress: params.get('wallet') || undefined,
      basePrice: params.get('base') ? Number(params.get('base')) : undefined,
      finalPrice: params.get('final') ? Number(params.get('final')) : undefined,
      conditions: params.get('conditions') ? JSON.parse(decodeURIComponent(params.get('conditions')!)) : [],
      locationJson: params.get('location') ? decodeURIComponent(params.get('location')!) : '',
      astralProofUid: params.get('astral') ? decodeURIComponent(params.get('astral')!) : '',
    };

    // Create attestation with retry — use ref to track success across closures
    let done = false;
    let attempt = 0;

    async function tryCreate() {
      if (done || attempt >= 5) { if (!done) setPolling(false); return; }
      attempt++;
      try {
        const res = await fetch('/api/create-attestation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            walletAddress: paymentData.walletAddress || undefined,
            basePrice: paymentData.basePrice || 10,
            finalPrice: paymentData.finalPrice || 10,
            conditions: paymentData.conditions || [],
            locationJson: paymentData.locationJson || '',
            astralProofUid: paymentData.astralProofUid || '',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          done = true;
          setAttestation(data);
          setPolling(false);
          return;
        }
        console.warn(`Attestation attempt ${attempt} failed: ${res.status}`);
      } catch (err) {
        console.warn(`Attestation attempt ${attempt} error:`, err);
      }
      // Retry with backoff
      setTimeout(tryCreate, attempt * 3000);
    }

    setTimeout(tryCreate, 1500);
    return () => { done = true; };
  }, [orderId]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="bg-pp-surface border border-pp-border rounded-2xl p-10 max-w-md w-full text-center space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}>
          <CheckCircle className="w-16 h-16 text-pp-green mx-auto" />
        </motion.div>

        <div>
          <h1 className="font-head text-2xl font-bold text-pp-text">Payment Confirmed</h1>
          <p className="text-sm text-pp-tertiary mt-1 font-mono">{orderId}</p>
        </div>

        {polling ? (
          <div className="flex items-center justify-center gap-2 text-pp-secondary text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Creating onchain attestation...
          </div>
        ) : attestation ? (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="attestation-new bg-pp-teal-sub/20 border border-pp-teal/30 rounded-xl p-5 text-left space-y-2">
            <div className="flex items-center gap-2 text-pp-teal text-sm font-medium">
              <Shield className="w-4 h-4" /> Price Proof Attested
            </div>
            <p className="font-mono text-xs text-pp-secondary truncate">{attestation.proofId}</p>
          </motion.div>
        ) : (
          <div className="text-center space-y-2">
            <p className="text-sm text-pp-tertiary">Attestation creation timed out.</p>
            <button onClick={() => { setPolling(true); setTimeout(async () => {
              try {
                let pd: any = {};
                try { pd = JSON.parse(localStorage.getItem('dc-last-payment') || '{}'); } catch {}
                const res = await fetch('/api/create-attestation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, ...pd }) });
                if (res.ok) { setAttestation(await res.json()); }
              } catch {} finally { setPolling(false); }
            }, 500); }} className="text-sm text-pp-blue hover:text-pp-blue-hover">
              Retry
            </button>
          </div>
        )}

        <div className="space-y-2 pt-2">
          <Link href="/attestations" className="block w-full bg-pp-blue hover:bg-pp-blue-hover text-white font-semibold text-sm py-2.5 rounded-lg transition-all text-center">
            View Attestations
          </Link>
          <Link href="/checkout" className="block w-full bg-transparent hover:bg-pp-raised border border-pp-border text-pp-text font-medium text-sm py-2.5 rounded-lg transition-all text-center">
            Another Payment
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function CheckoutSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-pp-blue animate-spin" /></div>}>
      <Content />
    </Suspense>
  );
}
