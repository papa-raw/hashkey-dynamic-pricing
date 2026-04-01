import { NextRequest, NextResponse } from 'next/server';
import { merchantRules } from '@/lib/pending-payments';
import type { PriceRule } from '@/lib/types';

export async function GET() {
  return NextResponse.json({ rules: merchantRules });
}

export async function PUT(request: NextRequest) {
  const { rules } = await request.json() as { rules: PriceRule[] };
  merchantRules.length = 0;
  merchantRules.push(...rules);
  return NextResponse.json({ rules: merchantRules });
}
