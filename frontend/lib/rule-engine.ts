import type { OracleResult } from './oracle-adapters';
import type { PriceRule, EvaluatedCondition } from './types';

export type StackingMode = 'best' | 'stack';

export function evaluatePrice(
  basePrice: number,
  rules: PriceRule[],
  oracleData: OracleResult[],
  mode: StackingMode = 'best'
) {
  const conditions: EvaluatedCondition[] = [];

  for (const rule of rules.filter(r => r.active)) {
    const oracle = oracleData.find(o => o.type === rule.conditionType);
    if (!oracle) continue;

    let matched = false;
    switch (rule.operator) {
      case 'lt': matched = oracle.value < rule.threshold; break;
      case 'gt': matched = oracle.value > rule.threshold; break;
      case 'eq': matched = oracle.value === rule.threshold; break;
      case 'between': matched = oracle.value >= rule.threshold && oracle.value <= (rule.thresholdHigh || rule.threshold); break;
    }

    conditions.push({ rule, oracleValue: oracle.value, matched, adjustmentBps: matched ? rule.adjustmentBps : 0 });
  }

  const matchedConditions = conditions.filter(c => c.matched);
  let bestDiscount: EvaluatedCondition | null = null;
  let totalAdjustmentBps = 0;

  if (matchedConditions.length > 0) {
    if (mode === 'stack') {
      // Sum all matched discounts
      totalAdjustmentBps = matchedConditions.reduce((sum, c) => sum + c.adjustmentBps, 0);
      // Cap at -10000 (100% off)
      totalAdjustmentBps = Math.max(-10000, totalAdjustmentBps);
      bestDiscount = matchedConditions[0]; // just for display
    } else {
      // Best single discount
      bestDiscount = matchedConditions.reduce((best, c) => c.adjustmentBps < best.adjustmentBps ? c : best);
      totalAdjustmentBps = bestDiscount.adjustmentBps;
    }
  }

  const finalPrice = Math.max(0, basePrice * (1 + totalAdjustmentBps / 10000));
  return { basePrice, finalPrice, conditions, bestDiscount, totalAdjustmentBps, mode, matchedCount: matchedConditions.length };
}
