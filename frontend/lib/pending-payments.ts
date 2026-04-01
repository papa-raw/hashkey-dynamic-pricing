import type { PriceRule } from './types';

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

// Shared merchant rules — editable from dashboard, read by checkout
export const merchantRules: PriceRule[] = [
  { id: 1, conditionType: 'gas', operator: 'lt', threshold: 10, adjustmentBps: -3000, label: 'Low congestion: 30% off', active: true },
  { id: 2, conditionType: 'reputation', operator: 'gt', threshold: 50, adjustmentBps: -2000, label: 'Loyalty (50+ txns): 20% off', active: true },
  { id: 3, conditionType: 'time', operator: 'between', threshold: 0, thresholdHigh: 6, adjustmentBps: -5000, label: 'Off-peak (midnight-6am): 50% off', active: true },
  { id: 4, conditionType: 'location', operator: 'eq', threshold: 1, adjustmentBps: -1000, label: 'HK jurisdiction: 10% off', active: true },
];
