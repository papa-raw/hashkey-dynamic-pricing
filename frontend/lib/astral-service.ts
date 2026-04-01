import { AstralSDK } from '@decentralized-geo/astral-sdk';
import { ethers } from 'ethers';

let astralInstance: InstanceType<typeof AstralSDK> | null = null;

export async function initAstral(): Promise<void> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('No wallet detected');
  }

  // BrowserProvider's JsonRpcSigner doesn't support resolveName (no ENS on HashKey Chain).
  // EAS SDK's OnchainRegistrar requires it. Fix: create a Wallet from the signer's private...
  // No — we can't get private key from MetaMask. Instead, override the provider's resolveName.
  const rawProvider = new ethers.BrowserProvider((window as any).ethereum);

  // ethers v6 JsonRpcSigner throws UNSUPPORTED_OPERATION for resolveName on chains without ENS.
  // EAS SDK constructs contracts in its constructor, triggering this check.
  // Fix: patch both provider and signer to handle resolveName gracefully.
  rawProvider.resolveName = async (name: string) => {
    if (ethers.isAddress(name)) return name;
    return name; // pass through — addresses don't need resolution
  };

  const signer = await rawProvider.getSigner();

  // Also patch the signer itself
  (signer as any).resolveName = async (name: string) => {
    if (ethers.isAddress(name)) return name;
    return name;
  };

  astralInstance = new AstralSDK({
    chainId: 133,
    signer: signer as unknown,
    apiUrl: process.env.NEXT_PUBLIC_ASTRAL_API_URL || 'https://staging-api.astral.global',
  });
}

export async function createLocationProof(lat: number, lng: number, memo: string): Promise<{
  uid: string; signer: string; signature: unknown;
}> {
  if (!astralInstance) throw new Error('Astral SDK not initialized. Call initAstral() first.');
  const attestation = await astralInstance.location.offchain.create({
    location: { type: 'Point', coordinates: [lng, lat] },
    locationType: 'geojson-point',
    timestamp: new Date(),
    memo,
  });
  return { uid: attestation.uid, signer: attestation.signer, signature: attestation.signature };
}

export function getCurrentPosition(): Promise<{ latitude: number; longitude: number; accuracy: number }> {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return Promise.resolve({
      latitude: parseFloat(process.env.NEXT_PUBLIC_DEMO_LAT || '22.3193'),
      longitude: parseFloat(process.env.NEXT_PUBLIC_DEMO_LNG || '114.1694'),
      accuracy: 10,
    });
  }
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => reject(new Error(`GPS failed: ${err.message}`)),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  });
}
