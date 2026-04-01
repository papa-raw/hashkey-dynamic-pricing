import { NextRequest, NextResponse } from 'next/server';
import { evaluatePrice } from '@/lib/rule-engine';
import { getGasPrice, getTimeOfDay, getWalletReputation, getLocationData } from '@/lib/oracle-adapters';

const DEMO_RULES = [
  { id: 1, conditionType: 'gas' as const, operator: 'lt' as const, threshold: 10, adjustmentBps: -3000, label: 'Low congestion: 30% off', active: true },
  { id: 2, conditionType: 'reputation' as const, operator: 'gt' as const, threshold: 50, adjustmentBps: -2000, label: 'Loyalty (50+ txns): 20% off', active: true },
  { id: 3, conditionType: 'time' as const, operator: 'between' as const, threshold: 0, thresholdHigh: 6, adjustmentBps: -5000, label: 'Off-peak (midnight-6am): 50% off', active: true },
  { id: 4, conditionType: 'location' as const, operator: 'eq' as const, threshold: 1, adjustmentBps: -1000, label: 'HK jurisdiction: 10% off', active: true },
];

export async function POST(request: NextRequest) {
  const { walletAddress, basePrice, lat, lng } = await request.json();
  const oracleData = await Promise.all([
    getGasPrice(),
    Promise.resolve(getTimeOfDay(lat, lng)),
    getWalletReputation(walletAddress || '0x0000000000000000000000000000000000000000'),
    ...(lat && lng ? [Promise.resolve(getLocationData(lat, lng))] : []),
  ]);
  const result = evaluatePrice(basePrice, DEMO_RULES, oracleData);
  return NextResponse.json({ ...result, oracleData });
}
