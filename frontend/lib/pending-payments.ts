// Shared in-memory store (hackathon — production would use DB)
export const pendingPayments = new Map<string, {
  payer: string;
  basePrice: number;
  finalPrice: number;
  conditionsJson: string;
  locationJson: string;
  astralProofUid: string;
}>();

export const attestationResults = new Map<string, { proofId: string; txHash: string }>();
