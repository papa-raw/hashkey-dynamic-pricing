import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { PROOFPAY_ATTESTATION_ABI, PROOFPAY_ATTESTATION_ADDRESS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.HASHKEY_TESTNET_RPC || 'https://testnet.hsk.xyz');
    const contract = new ethers.Contract(PROOFPAY_ATTESTATION_ADDRESS, PROOFPAY_ATTESTATION_ABI, provider);
    const filter = contract.filters.PriceProofCreated();
    // Query from block 25933400 onwards (skips test data created before real attestations)
    const REAL_DATA_START_BLOCK = 25933400;
    const events = await contract.queryFilter(filter, REAL_DATA_START_BLOCK);
    const realEvents = events;

    // For each event, fetch the full proof to get conditionsJson
    const attestations = await Promise.all(
      realEvents.slice(-30).reverse().map(async (event) => {
        const log = event as ethers.EventLog;
        const proofId = log.args?.[0] ?? '';

        let conditionsJson = '[]';
        let locationJson = '';
        try {
          const proof = await contract.getProof(proofId);
          conditionsJson = proof.conditionsJson || '[]';
          locationJson = proof.locationJson || '';
        } catch {}

        return {
          proofId,
          merchant: log.args?.[1] ?? '',
          payer: log.args?.[2] ?? '',
          basePrice: log.args?.[3]?.toString() ?? '0',
          finalPrice: log.args?.[4]?.toString() ?? '0',
          hspRequestId: log.args?.[5] ?? '',
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          conditionsJson,
          locationJson,
        };
      })
    );

    return NextResponse.json({ attestations });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown', attestations: [] });
  }
}
