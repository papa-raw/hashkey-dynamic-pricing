export interface PriceRule {
  id: number;
  conditionType: 'gas' | 'time' | 'reputation' | 'location';
  operator: 'lt' | 'gt' | 'eq' | 'between';
  threshold: number;
  thresholdHigh?: number;
  adjustmentBps: number;
  label: string;
  active: boolean;
}

export interface EvaluatedCondition {
  rule: PriceRule;
  oracleValue: number;
  matched: boolean;
  adjustmentBps: number;
}

export interface PriceResult {
  basePrice: number;
  finalPrice: number;
  conditions: EvaluatedCondition[];
  bestDiscount: EvaluatedCondition | null;
  totalAdjustmentBps: number;
  oracleData: OracleData[];
}

export interface OracleData {
  type: string;
  value: number;
  label: string;
}

export interface PriceProof {
  proofId: string;
  merchant: string;
  payer: string;
  basePrice: string;
  finalPrice: string;
  conditionsJson: string;
  locationJson: string;
  astralProofUid: string;
  hspRequestId: string;
  timestamp: number;
  txHash?: string;
  blockNumber?: number;
}
