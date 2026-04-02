'use client';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, AlertCircle, MapPin, Shield } from 'lucide-react';
import { useAccount } from 'wagmi';
import { Tooltip } from '@/components/Tooltip';

type Status = 'idle' | 'gps' | 'verifying' | 'done' | 'error';

const DEMO_COORDS = { latitude: 22.3193, longitude: 114.1694 };

export function LocationProof({ onProofCreated }: { onProofCreated: (p: { uid: string; lat: number; lng: number; teeVerified?: boolean; credibility?: any }) => void }) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const { address } = useAccount();

  async function verify(demo: boolean) {
    setStatus('gps');
    setError('');
    try {
      // Get coordinates
      let lat: number, lng: number;
      if (demo) {
        lat = DEMO_COORDS.latitude;
        lng = DEMO_COORDS.longitude;
      } else {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }

      setStatus('verifying');

      // Submit to our server-side API which calls Astral's TEE verification
      const res = await fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, walletAddress: address }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setResult(data);
      setStatus('done');
      onProofCreated({ uid: data.uid, lat, lng, teeVerified: data.teeVerified, credibility: data.credibility });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Location verification failed');
      setStatus('error');
    }
  }

  const spatialScore = result?.credibility?.dimensions?.spatial;
  const temporalScore = result?.credibility?.dimensions?.temporal;

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
          <p className="text-xs text-pp-tertiary mt-0.5">
            {status === 'done' && result?.teeVerified
              ? 'TEE-verified via Astral Protocol'
              : 'Astral Protocol TEE verification for jurisdiction pricing'}
          </p>
          {result?.uid && result.uid !== 'unverified' && (
            <p className="mt-1.5 text-[11px] font-mono text-pp-tertiary truncate">
              UID: {result.uid.slice(0, 18)}...
            </p>
          )}
        </div>

        <div className="flex-shrink-0">
          {status === 'idle' && (
            <div className="flex items-center gap-2">
              <button onClick={() => verify(false)} className="bg-pp-blue hover:bg-pp-blue-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-150">
                Verify
              </button>
              <Tooltip content="Use preset Hong Kong coordinates (22.32, 114.17) for judges without GPS">
                <button onClick={() => verify(true)} className="text-[11px] text-pp-tertiary hover:text-pp-secondary border border-pp-border-sub hover:border-pp-border px-2.5 py-1.5 rounded-lg transition-all">
                  Demo
                </button>
              </Tooltip>
            </div>
          )}
          {(status === 'gps' || status === 'verifying') && (
            <div className="flex items-center gap-2 text-sm text-pp-secondary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{status === 'gps' ? 'GPS...' : 'TEE verifying...'}</span>
            </div>
          )}
          {status === 'done' && (
            <div className="flex items-center gap-1.5 text-sm font-medium">
              {result?.teeVerified ? (
                <Tooltip content="Location verified inside Astral's Trusted Execution Environment with cross-correlation analysis">
                  <span className="flex items-center gap-1 text-pp-teal cursor-help">
                    <Shield className="w-4 h-4" /> TEE Verified
                  </span>
                </Tooltip>
              ) : (
                <span className="flex items-center gap-1 text-pp-green">
                  <CheckCircle className="w-4 h-4" /> Verified
                </span>
              )}
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2">
              <button onClick={() => verify(false)} className="text-sm text-pp-red hover:text-pp-red/80 transition-colors flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Retry
              </button>
              <button onClick={() => verify(true)} className="text-[11px] text-pp-tertiary hover:text-pp-secondary transition-colors">
                Demo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TEE credibility details */}
      {result?.teeVerified && result?.credibility && (
        <div className="mt-3 bg-pp-teal-sub/20 border border-pp-teal/15 rounded-lg px-3 py-2 text-[11px]">
          <div className="flex items-center gap-4 text-pp-secondary">
            <span>Method: <span className="text-pp-teal font-mono">{result.evaluationMethod}</span></span>
            <span>Temporal: <span className="text-pp-text">{((temporalScore?.meanOverlap ?? 0) * 100).toFixed(0)}%</span></span>
            <span>Stamps: <span className="text-pp-text">{result.credibility.meta?.stampCount}</span></span>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-pp-red">{error}</p>}
    </motion.div>
  );
}
