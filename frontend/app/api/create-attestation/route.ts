import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { PROOFPAY_ATTESTATION_ABI, PROOFPAY_ATTESTATION_ADDRESS } from '@/lib/constants';

// Creates an onchain attestation for a completed payment
// Called from the success page after HSP payment completes
export async function POST(request: NextRequest) {
  const { orderId, walletAddress, basePrice, finalPrice, conditions, locationJson, astralProofUid } = await request.json();

  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  try {
    const provider = new ethers.JsonRpcProvider(process.env.HASHKEY_TESTNET_RPC || 'https://testnet.hsk.xyz');
    const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);
    const contract = new ethers.Contract(PROOFPAY_ATTESTATION_ADDRESS, PROOFPAY_ATTESTATION_ABI, wallet);

    const tx = await contract.createProof(
      walletAddress || wallet.address,
      ethers.parseUnits(String(basePrice || 10), 6),
      ethers.parseUnits(String(finalPrice || 5), 6),
      JSON.stringify(conditions || []),
      locationJson || '',
      ethers.id(astralProofUid || 'none'),
      ethers.id(orderId),
    );
    const receipt = await tx.wait();

    return NextResponse.json({
      proofId: receipt!.hash,
      txHash: receipt!.hash,
      orderId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Attestation creation failed';
    console.error('[create-attestation]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
