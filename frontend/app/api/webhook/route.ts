import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { ethers } from 'ethers';
import { PROOFPAY_ATTESTATION_ABI, PROOFPAY_ATTESTATION_ADDRESS } from '@/lib/constants';
import { attestationResults, pendingPayments } from '@/lib/pending-payments';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const payload = JSON.parse(rawBody);
  const { status, payment_request_id } = payload;
  console.log(`[webhook] ${payload.event_type} — ${status} — ${payment_request_id}`);

  if (status === 'payment-successful' || status === 'payment-included') {
    const pending = pendingPayments.get(payment_request_id);
    try {
      const provider = new ethers.JsonRpcProvider(process.env.HASHKEY_TESTNET_RPC || 'https://testnet.hsk.xyz');
      const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);
      const contract = new ethers.Contract(PROOFPAY_ATTESTATION_ADDRESS, PROOFPAY_ATTESTATION_ABI, wallet);

      const tx = await contract.createProof(
        pending?.payer || wallet.address,
        ethers.parseUnits(String(pending?.basePrice || 10), 6),
        ethers.parseUnits(String(pending?.finalPrice || 5), 6),
        pending?.conditionsJson || '[]',
        pending?.locationJson || '',
        ethers.id(pending?.astralProofUid || 'none'),
        ethers.id(payment_request_id || 'unknown'),
      );
      const receipt = await tx.wait();
      console.log(`[webhook] Attestation tx: ${receipt!.hash}`);
      attestationResults.set(payment_request_id, { proofId: receipt!.hash, txHash: receipt!.hash });
      if (pending) pendingPayments.delete(payment_request_id);
    } catch (err: unknown) {
      console.error(`[webhook] Attestation failed:`, err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({ code: 0 });
}
