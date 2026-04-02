import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const ASTRAL_API = process.env.NEXT_PUBLIC_ASTRAL_API_URL || 'https://staging-api.astral.global';
const SCHEMA_UID = '0x9efcbaa4a39a233977a6db557fd81ba5adc9023ca731db86cfd562c4fbf4073e';

export async function POST(request: NextRequest) {
  const { lat, lng, walletAddress } = await request.json();

  if (lat === undefined || lng === undefined) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);
  const location = { type: 'Point', coordinates: [lng, lat] };

  // Create a signed stamp using the deployer wallet (server-side signing)
  const provider = new ethers.JsonRpcProvider(process.env.HASHKEY_TESTNET_RPC || 'https://testnet.hsk.xyz');
  const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);

  // Sign the location data as a stamp
  const stampData = JSON.stringify({ location, timestamp: now, plugin: 'browser-geolocation' });
  const stampSignature = await wallet.signMessage(stampData);

  try {
    // Submit to Astral's TEE verification endpoint
    const verifyRes = await fetch(`${ASTRAL_API}/verify/v0/proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proof: {
          claim: {
            lpVersion: '0.2',
            locationType: 'geojson-point',
            srs: 'EPSG:4326',
            location: JSON.stringify(location),
            subject: { scheme: 'ethereum', value: walletAddress || wallet.address },
            radius: 1000,
            time: { start: now - 60, end: now }
          },
          stamps: [{
            lpVersion: '0.2',
            locationType: 'geojson-point',
            srs: 'EPSG:4326',
            location,
            plugin: 'browser-geolocation',
            pluginVersion: '0.1.0',
            timestamp: now,
            temporalFootprint: { start: now - 60, end: now },
            signals: { lat, lng, accuracy: 100, source: 'navigator.geolocation' },
            signatures: [{
              scheme: 'eip191',
              value: stampSignature,
              signer: { scheme: 'ethereum', value: wallet.address },
              algorithm: 'secp256k1',
              timestamp: now
            }]
          }]
        },
        options: { schema: SCHEMA_UID }
      }),
    });

    if (!verifyRes.ok) {
      const errText = await verifyRes.text();
      console.error('[location] Astral verification failed:', errText);
      return NextResponse.json({ error: 'Verification failed', details: errText }, { status: 500 });
    }

    const result = await verifyRes.json();

    return NextResponse.json({
      uid: result.attestation?.uid || 'unverified',
      credibility: result.credibility,
      evaluationMethod: result.evaluationMethod,
      evaluatedAt: result.evaluatedAt,
      attestation: result.attestation,
      teeVerified: result.credibility?.meta?.evaluationMode === 'tee',
      lat,
      lng,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Astral verification error';
    console.error('[location] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
