import { NextRequest, NextResponse } from 'next/server';
import { evaluatePrice } from '@/lib/rule-engine';
import { getGasPrice, getTimeOfDay, getWalletReputation, getLocationData } from '@/lib/oracle-adapters';

const DEFAULT_RULES = [
  { id: 1, conditionType: 'gas' as const, operator: 'lt' as const, threshold: 10, adjustmentBps: -200, label: 'Low congestion discount', active: true },
  { id: 2, conditionType: 'reputation' as const, operator: 'gt' as const, threshold: 50, adjustmentBps: -2000, label: 'Loyalty reward', active: true },
  { id: 3, conditionType: 'time' as const, operator: 'between' as const, threshold: 0, thresholdHigh: 6, adjustmentBps: -5000, label: 'Off-peak pricing', active: true },
  { id: 4, conditionType: 'location' as const, operator: 'eq' as const, threshold: 1, adjustmentBps: -1000, label: 'Hong Kong pricing', active: true },
];

export async function POST(request: NextRequest) {
  const { walletAddress, basePrice, lat, lng, rules, stackingMode, localHour } = await request.json();
  const activeRules = rules && Array.isArray(rules) && rules.length > 0 ? rules : DEFAULT_RULES;
  const mode = stackingMode === 'stack' ? 'stack' : 'best';

  const oracleData = await Promise.all([
    getGasPrice(),
    Promise.resolve(getTimeOfDay(lat, lng, localHour)),
    getWalletReputation(walletAddress || '0x0000000000000000000000000000000000000000'),
    ...(lat && lng ? [Promise.resolve(getLocationData(lat, lng))] : []),
  ]);
  const result = evaluatePrice(basePrice, activeRules, oracleData, mode);
  return NextResponse.json({ ...result, oracleData });
}
