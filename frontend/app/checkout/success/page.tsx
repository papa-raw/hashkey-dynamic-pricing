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
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`/api/attestation?order=${orderId}`);
        if (res.ok) { const d = await res.json(); if (d.proofId) { setAttestation(d); setPolling(false); } }
      } catch {}
    }, 3000);
    const to = setTimeout(() => { setPolling(false); clearInterval(iv); }, 60000);
    return () => { clearInterval(iv); clearTimeout(to); };
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
          <p className="text-sm text-pp-tertiary">Attestation will appear once the webhook fires.</p>
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
