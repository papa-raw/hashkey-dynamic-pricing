'use client';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { getCurrentPosition, createLocationProof, initAstral } from '@/lib/astral-service';
import { Tooltip } from '@/components/Tooltip';

type Status = 'idle' | 'gps' | 'proving' | 'done' | 'error';

const DEMO_COORDS = { latitude: 22.3193, longitude: 114.1694, accuracy: 10 }; // Hong Kong

export function LocationProof({ onProofCreated }: { onProofCreated: (p: { uid: string; lat: number; lng: number }) => void }) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [uid, setUid] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const posRef = useRef<{ latitude: number; longitude: number } | null>(null);

  async function verify(demo: boolean) {
    setStatus('gps');
    setError('');
    setIsDemo(demo);
    try {
      const pos = demo ? DEMO_COORDS : await getCurrentPosition();
      posRef.current = pos;
      setStatus('proving');

      await initAstral();
      const proof = await createLocationProof(pos.latitude, pos.longitude, 'Dynamic Checkout location verification');

      setUid(proof.uid);
      setStatus('done');
      onProofCreated({ uid: proof.uid, lat: pos.latitude, lng: pos.longitude });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Location proof failed');
      setStatus('error');
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-pp-border-sub p-5"
    >
      <div className="flex items-center gap-4">
        <div className="location-globe flex-shrink-0">
          {status === 'done' && <div className="location-dot" style={{ left: '58%', top: '38%' }} />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-pp-text">Location Verification</p>
          <p className="text-xs text-pp-tertiary mt-0.5">Astral Protocol proof for jurisdiction pricing</p>
          {uid && (
            <p className="mt-1.5 text-[11px] font-mono text-pp-tertiary truncate">
              UID: {uid.slice(0, 22)}...
              {isDemo && <span className="ml-2 text-pp-orange">(demo: Hong Kong)</span>}
            </p>
          )}
        </div>

        <div className="flex-shrink-0">
          {status === 'idle' && (
            <div className="flex items-center gap-2">
              <button onClick={() => verify(false)} className="bg-pp-blue hover:bg-pp-blue-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-150">
                Verify
              </button>
              <Tooltip content="Use preset Hong Kong coordinates (22.32, 114.17) for judges without GPS access">
                <button onClick={() => verify(true)} className="text-[11px] text-pp-tertiary hover:text-pp-secondary border border-pp-border-sub hover:border-pp-border px-2.5 py-1.5 rounded-lg transition-all">
                  Demo
                </button>
              </Tooltip>
            </div>
          )}
          {(status === 'gps' || status === 'proving') && (
            <div className="flex items-center gap-2 text-sm text-pp-secondary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{status === 'gps' ? 'GPS...' : 'Creating proof...'}</span>
            </div>
          )}
          {status === 'done' && (
            <div className="flex items-center gap-1.5 text-sm text-pp-teal font-medium">
              <CheckCircle className="w-4 h-4" /> Proven
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2">
              <button onClick={() => verify(false)} className="flex items-center gap-1 text-sm text-pp-red hover:text-pp-red/80 transition-colors">
                <AlertCircle className="w-3.5 h-3.5" /> Retry
              </button>
              <button onClick={() => verify(true)} className="text-[11px] text-pp-tertiary hover:text-pp-secondary transition-colors">
                Demo
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-pp-red">{error}</p>
      )}
    </motion.div>
  );
}
