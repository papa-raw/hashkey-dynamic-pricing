import { NextRequest, NextResponse } from 'next/server';
import { AstralSDK } from '@decentralized-geo/astral-sdk';
import { ethers } from 'ethers';

let astral: InstanceType<typeof AstralSDK> | null = null;

function getAstral() {
  if (astral) return astral;
  const provider = new ethers.JsonRpcProvider('https://testnet.hsk.xyz');
  const signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);
  astral = new AstralSDK({
    chainId: 84532,
    signer: signer as unknown,
    apiUrl: process.env.NEXT_PUBLIC_ASTRAL_API_URL || 'https://staging-api.astral.global',
  });
  return astral;
}

export async function POST(request: NextRequest) {
  const { lat, lng } = await request.json();

  if (lat === undefined || lng === undefined) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  try {
    const sdk = getAstral();
    const attestation = await sdk.location.offchain.create({
      location: { type: 'Point', coordinates: [lng, lat] },
      locationType: 'geojson-point',
      timestamp: new Date(),
      memo: `Dynamic Checkout location proof: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    });

    return NextResponse.json({
      uid: attestation.uid,
      signer: attestation.signer,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Astral proof failed';
    console.error('[location] Astral error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
