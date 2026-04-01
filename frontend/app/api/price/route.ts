import { NextRequest, NextResponse } from 'next/server';
import { evaluatePrice } from '@/lib/rule-engine';
import { getGasPrice, getTimeOfDay, getWalletReputation, getLocationData } from '@/lib/oracle-adapters';
import { merchantRules } from '@/lib/pending-payments';

export async function POST(request: NextRequest) {
  const { walletAddress, basePrice, lat, lng } = await request.json();
  const oracleData = await Promise.all([
    getGasPrice(),
    Promise.resolve(getTimeOfDay(lat, lng)),
    getWalletReputation(walletAddress || '0x0000000000000000000000000000000000000000'),
    ...(lat && lng ? [Promise.resolve(getLocationData(lat, lng))] : []),
  ]);
  const result = evaluatePrice(basePrice, merchantRules, oracleData);
  return NextResponse.json({ ...result, oracleData });
}
