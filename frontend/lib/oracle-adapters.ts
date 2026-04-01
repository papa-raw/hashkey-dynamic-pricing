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

export function getTimeOfDay(lat?: number, lng?: number): OracleResult {
  let hour: number;
  if (lat !== undefined && lng !== undefined) {
    const tzOffset = Math.round(lng / 15);
    hour = (new Date().getUTCHours() + tzOffset + 24) % 24;
  } else {
    hour = new Date().getUTCHours();
  }
  return { type: 'time', value: hour, label: `${hour}:00 ${lat ? 'local' : 'UTC'}`, raw: { hour, hasLocation: lat !== undefined } };
}

export async function getWalletReputation(address: string): Promise<OracleResult> {
  const p = getProvider();
  const [txCount, balance] = await Promise.all([p.getTransactionCount(address), p.getBalance(address)]);
  const balanceHSK = Number(ethers.formatEther(balance));
  return { type: 'reputation', value: txCount, label: `${txCount} txns, ${balanceHSK.toFixed(2)} HSK`, raw: { txCount, balanceHSK } };
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
  return { code: 0, name: 'Global', region: 'Global' };
}
