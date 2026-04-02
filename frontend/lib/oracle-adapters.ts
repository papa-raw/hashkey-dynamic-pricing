import { ethers } from 'ethers';

function getProvider() {
  return new ethers.JsonRpcProvider(
    process.env.NEXT_PUBLIC_RPC_URL || process.env.HASHKEY_TESTNET_RPC || 'https://testnet.hsk.xyz'
  );
}

export interface OracleResult {
  type: 'gas' | 'time' | 'reputation' | 'location';
  value: number;
  label: string;
  raw: unknown;
}

export async function getGasPrice(): Promise<OracleResult> {
  const feeData = await getProvider().getFeeData();
  const gasGwei = Number(feeData.gasPrice ?? BigInt(0)) / 1e9;
  return { type: 'gas', value: gasGwei, label: `${gasGwei.toFixed(2)} gwei`, raw: feeData };
}

export function getTimeOfDay(lat?: number, lng?: number, clientLocalHour?: number): OracleResult {
  // Client sends their actual local hour — use it directly
  if (typeof clientLocalHour === 'number') {
    return { type: 'time', value: clientLocalHour, label: `${clientLocalHour}:00 local`, raw: { hour: clientLocalHour, source: 'client' } };
  }
  // Fallback: compute from longitude or use UTC
  if (lng !== undefined && lng !== 0) {
    const tzOffset = Math.round(lng / 15);
    const hour = (new Date().getUTCHours() + tzOffset + 24) % 24;
    return { type: 'time', value: hour, label: `${hour}:00 local`, raw: { hour, source: 'longitude' } };
  }
  const hour = new Date().getUTCHours();
  return { type: 'time', value: hour, label: `${hour}:00 UTC`, raw: { hour, source: 'server-utc' } };
}

export async function getWalletReputation(address: string): Promise<OracleResult> {
  const p = getProvider();
  // Count prior payments by this wallet via ProofPayAttestation events
  // This is real merchant loyalty — how many times has this payer paid through Dynamic Checkout?
  const { PROOFPAY_ATTESTATION_ADDRESS, PROOFPAY_ATTESTATION_ABI } = await import('./constants');
  const contract = new ethers.Contract(PROOFPAY_ATTESTATION_ADDRESS, PROOFPAY_ATTESTATION_ABI, p);
  let priorPayments = 0;
  try {
    const filter = contract.filters.PriceProofCreated(null, null, address);
    const events = await contract.queryFilter(filter, -100000);
    priorPayments = events.length;
  } catch {}
  return { type: 'reputation', value: priorPayments, label: `${priorPayments} prior payments`, raw: { priorPayments } };
}

export function getLocationData(lat: number, lng: number): OracleResult {
  const j = getJurisdiction(lat, lng);
  return { type: 'location', value: j.code, label: j.name, raw: { lat, lng, jurisdiction: j } };
}

function getJurisdiction(lat: number, lng: number) {
  if (lat > 22 && lat < 23 && lng > 113 && lng < 115) return { code: 1, name: 'Hong Kong', region: 'APAC' };
  if (lat > 1 && lat < 2 && lng > 103 && lng < 104) return { code: 2, name: 'Singapore', region: 'APAC' };
  if (lat > 35 && lat < 36 && lng > 139 && lng < 140) return { code: 3, name: 'Tokyo', region: 'APAC' };
  if (lat > 51 && lat < 52 && lng > -1 && lng < 1) return { code: 4, name: 'London', region: 'EMEA' };
  if (lat > 40 && lat < 41 && lng > -75 && lng < -73) return { code: 5, name: 'New York', region: 'Americas' };
  if (lat > 52 && lat < 53 && lng > 13 && lng < 14) return { code: 6, name: 'Berlin', region: 'EMEA' };
  if (lat > 41.3 && lat < 41.5 && lng > 2.0 && lng < 2.3) return { code: 7, name: 'Barcelona', region: 'EMEA' };
  return { code: 0, name: 'Global', region: 'Global' };
}
