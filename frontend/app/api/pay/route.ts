import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/hsp-client';
import { pendingPayments } from '@/lib/pending-payments';

function getHspConfig() {
  return {
    baseUrl: process.env.HSP_BASE_URL!,
    appKey: process.env.HSP_APP_KEY!,
    appSecret: process.env.HSP_APP_SECRET!,
    merchantPrivateKey: (process.env.HSP_MERCHANT_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    merchantName: 'Ecofrontiers',  // Must match HSP merchant registration
  };
}

export async function POST(request: NextRequest) {
  const { walletAddress, basePrice, finalPrice, conditions, locationJson, astralProofUid } = await request.json();
  const orderId = `PP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const payReqId = `PAY-${orderId}`;

  try {
    const result = await createOrder(getHspConfig(), {
      orderId,
      paymentRequestId: payReqId,
      payTo: process.env.DEPLOYER_ADDRESS || '0xB61906081aa8C8236a7259Fad09CFC46925ab255',
      amount: finalPrice.toFixed(2),
      coin: 'USDC',
      displayItems: [
        { label: 'Base price', currency: 'USD', value: basePrice.toFixed(2) },
        { label: 'Dynamic Checkout adjustment', currency: 'USD', value: (finalPrice - basePrice).toFixed(2) },
      ],
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?order=${orderId}`,
    });

    pendingPayments.set(result.paymentRequestId, {
      payer: walletAddress, basePrice, finalPrice,
      conditionsJson: JSON.stringify(conditions),
      locationJson: locationJson || '', astralProofUid: astralProofUid || '',
    });

    return NextResponse.json({ orderId, paymentRequestId: result.paymentRequestId, paymentUrl: result.paymentUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[pay] HSP order failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
