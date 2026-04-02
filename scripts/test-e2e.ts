// End-to-end tests: each pricing rule + TEE + attestation flow
// Run: cd hashkey && npx tsx scripts/test-e2e.ts
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();

const BASE = process.env.TEST_URL || 'https://dynamic-checkout-mu.vercel.app';
const RPC = 'https://testnet.hsk.xyz';
const ATTESTATION = '0x057Ac4C0FaaB720eBE9B60BDaBb3f55284429C34';
const WALLET = '0xC4d9d1a93068d311Ab18E988244123430eB4F1CD';

let passed = 0;
let failed = 0;
function ok(name: string, detail?: string) { passed++; console.log(`  ✅ ${name}${detail ? ' — ' + detail : ''}`); }
function fail(name: string, err: string) { failed++; console.log(`  ❌ ${name}: ${err}`); }

async function test(name: string, fn: () => Promise<void>) {
  try { await fn(); } catch (e: any) { fail(name, e.message); }
}

async function callPrice(body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/price`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress: WALLET, basePrice: 10, ...body }),
  });
  if (!res.ok) throw new Error(`Price API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  console.log(`\nTesting against: ${BASE}\n`);

  // ============================================
  console.log('=== RULE 1: GAS PRICE (< 10 gwei → 2% off) ===');
  // ============================================
  await test('Gas rule matches when gas < 10', async () => {
    const data = await callPrice({ localHour: 12 });
    const gasCond = data.conditions?.find((c: any) => c.rule.conditionType === 'gas');
    if (!gasCond) throw new Error('No gas condition in response');
    // HashKey testnet gas is always near 0
    if (!gasCond.matched) throw new Error(`Gas not matched (value=${gasCond.oracleValue})`);
    ok('Gas rule matches', `value=${gasCond.oracleValue.toFixed(4)} gwei, matched=${gasCond.matched}`);
  });

  await test('Gas discount is 2%', async () => {
    const rules = [{ id: 1, conditionType: 'gas', operator: 'lt', threshold: 10, adjustmentBps: -200, label: 'Gas test', active: true }];
    const data = await callPrice({ rules, localHour: 12 });
    if (Math.abs(data.finalPrice - 9.80) > 0.01) throw new Error(`Expected ~9.80, got ${data.finalPrice}`);
    ok('Gas discount correct', `$10.00 → $${data.finalPrice.toFixed(2)} (${(data.totalAdjustmentBps / -100).toFixed(0)}% off)`);
  });

  // ============================================
  console.log('\n=== RULE 2: LOYALTY (prior payments > threshold) ===');
  // ============================================
  await test('Loyalty oracle counts prior attestations', async () => {
    const data = await callPrice({ localHour: 12 });
    const repCond = data.conditions?.find((c: any) => c.rule.conditionType === 'reputation');
    if (!repCond) throw new Error('No reputation condition');
    ok('Loyalty oracle works', `value=${repCond.oracleValue} prior payments`);
  });

  await test('Loyalty matches when threshold met', async () => {
    const rules = [{ id: 1, conditionType: 'reputation', operator: 'gt', threshold: 1, adjustmentBps: -2000, label: 'Loyalty test', active: true }];
    const data = await callPrice({ rules, localHour: 12 });
    const repCond = data.conditions?.find((c: any) => c.rule.conditionType === 'reputation');
    if (repCond?.oracleValue > 1 && !repCond.matched) throw new Error('Should have matched');
    if (repCond?.matched) {
      if (Math.abs(data.finalPrice - 8.00) > 0.01) throw new Error(`Expected ~8.00, got ${data.finalPrice}`);
      ok('Loyalty discount correct', `$10.00 → $${data.finalPrice.toFixed(2)}, ${repCond.oracleValue} prior payments`);
    } else {
      ok('Loyalty not matched (insufficient payments)', `value=${repCond?.oracleValue}, threshold=1`);
    }
  });

  // ============================================
  console.log('\n=== RULE 3: TIME OF DAY (off-peak hours) ===');
  // ============================================
  await test('Time oracle uses client local hour', async () => {
    const data = await callPrice({ localHour: 3 });
    const timeCond = data.conditions?.find((c: any) => c.rule.conditionType === 'time');
    if (!timeCond) throw new Error('No time condition');
    if (timeCond.oracleValue !== 3) throw new Error(`Expected hour=3, got ${timeCond.oracleValue}`);
    ok('Time oracle returns client hour', `value=${timeCond.oracleValue}`);
  });

  await test('Off-peak matches at 3am', async () => {
    const rules = [{ id: 1, conditionType: 'time', operator: 'between', threshold: 0, thresholdHigh: 6, adjustmentBps: -5000, label: 'Off-peak test', active: true }];
    const data = await callPrice({ rules, localHour: 3 });
    const timeCond = data.conditions?.find((c: any) => c.rule.conditionType === 'time');
    if (!timeCond?.matched) throw new Error(`Off-peak not matched at hour 3`);
    if (Math.abs(data.finalPrice - 5.00) > 0.01) throw new Error(`Expected ~5.00, got ${data.finalPrice}`);
    ok('Off-peak discount correct', `$10.00 → $${data.finalPrice.toFixed(2)} at 3:00`);
  });

  await test('Off-peak does NOT match at noon', async () => {
    const rules = [{ id: 1, conditionType: 'time', operator: 'between', threshold: 0, thresholdHigh: 6, adjustmentBps: -5000, label: 'Off-peak test', active: true }];
    const data = await callPrice({ rules, localHour: 12 });
    const timeCond = data.conditions?.find((c: any) => c.rule.conditionType === 'time');
    if (timeCond?.matched) throw new Error(`Off-peak matched at noon — should not`);
    if (data.finalPrice !== 10) throw new Error(`Expected $10.00, got ${data.finalPrice}`);
    ok('No discount at noon', `$10.00 → $${data.finalPrice.toFixed(2)} at 12:00`);
  });

  // ============================================
  console.log('\n=== RULE 4: JURISDICTION (location = HK) ===');
  // ============================================
  await test('Jurisdiction matches HK coordinates', async () => {
    const rules = [{ id: 1, conditionType: 'location', operator: 'eq', threshold: 1, adjustmentBps: -1000, label: 'HK test', active: true }];
    const data = await callPrice({ rules, lat: 22.32, lng: 114.17, localHour: 12 });
    const locCond = data.conditions?.find((c: any) => c.rule.conditionType === 'location');
    if (!locCond?.matched) throw new Error(`HK jurisdiction not matched (value=${locCond?.oracleValue})`);
    if (Math.abs(data.finalPrice - 9.00) > 0.01) throw new Error(`Expected ~9.00, got ${data.finalPrice}`);
    ok('HK jurisdiction discount', `$10.00 → $${data.finalPrice.toFixed(2)}, code=${locCond.oracleValue}`);
  });

  await test('Jurisdiction does NOT match Berlin', async () => {
    const rules = [{ id: 1, conditionType: 'location', operator: 'eq', threshold: 1, adjustmentBps: -1000, label: 'HK test', active: true }];
    const data = await callPrice({ rules, lat: 52.52, lng: 13.40, localHour: 12 });
    const locCond = data.conditions?.find((c: any) => c.rule.conditionType === 'location');
    if (locCond?.matched) throw new Error(`HK matched for Berlin coords`);
    ok('Berlin not matched for HK rule', `code=${locCond?.oracleValue} (Berlin)`);
  });

  // ============================================
  console.log('\n=== STACKING MODE ===');
  // ============================================
  await test('Best discount mode picks single best', async () => {
    const rules = [
      { id: 1, conditionType: 'gas', operator: 'lt', threshold: 10, adjustmentBps: -200, label: 'Gas', active: true },
      { id: 2, conditionType: 'location', operator: 'eq', threshold: 1, adjustmentBps: -1000, label: 'HK', active: true },
    ];
    const data = await callPrice({ rules, lat: 22.32, lng: 114.17, localHour: 12, stackingMode: 'best' });
    // HK 10% should beat gas 2%
    if (Math.abs(data.finalPrice - 9.00) > 0.01) throw new Error(`Expected ~9.00 (best=10%), got ${data.finalPrice}`);
    ok('Best mode picks 10% over 2%', `$10.00 → $${data.finalPrice.toFixed(2)}`);
  });

  await test('Stack mode combines discounts', async () => {
    const rules = [
      { id: 1, conditionType: 'gas', operator: 'lt', threshold: 10, adjustmentBps: -200, label: 'Gas', active: true },
      { id: 2, conditionType: 'location', operator: 'eq', threshold: 1, adjustmentBps: -1000, label: 'HK', active: true },
    ];
    const data = await callPrice({ rules, lat: 22.32, lng: 114.17, localHour: 12, stackingMode: 'stack' });
    // 2% + 10% = 12%
    if (Math.abs(data.finalPrice - 8.80) > 0.01) throw new Error(`Expected ~8.80 (stacked=12%), got ${data.finalPrice}`);
    ok('Stack mode combines 2%+10%=12%', `$10.00 → $${data.finalPrice.toFixed(2)}`);
  });

  // ============================================
  console.log('\n=== TEE LOCATION VERIFICATION ===');
  // ============================================
  await test('Astral TEE verification returns valid result', async () => {
    const res = await fetch(`${BASE}/api/location`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: 22.3193, lng: 114.1694, walletAddress: WALLET }),
    });
    if (!res.ok) throw new Error(`Location API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.uid) throw new Error('No UID returned');
    if (!data.teeVerified) throw new Error(`TEE not verified: teeVerified=${data.teeVerified}`);
    if (data.evaluationMethod !== 'astral-v0.3.0-tee') throw new Error(`Wrong method: ${data.evaluationMethod}`);
    ok('TEE verification', `uid=${data.uid.slice(0, 16)}..., method=${data.evaluationMethod}`);
  });

  await test('TEE returns credibility scores', async () => {
    const res = await fetch(`${BASE}/api/location`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: 22.3193, lng: 114.1694, walletAddress: WALLET }),
    });
    const data = await res.json();
    if (!data.credibility) throw new Error('No credibility object');
    if (!data.credibility.dimensions) throw new Error('No dimensions');
    if (data.credibility.meta?.evaluationMode !== 'tee') throw new Error(`Mode: ${data.credibility.meta?.evaluationMode}`);
    ok('Credibility scores', `temporal=${data.credibility.dimensions.temporal?.meanOverlap}, mode=${data.credibility.meta.evaluationMode}`);
  });

  // ============================================
  console.log('\n=== ATTESTATION CREATION ===');
  // ============================================
  await test('Create attestation onchain', async () => {
    const res = await fetch(`${BASE}/api/create-attestation`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: `TEST-E2E-${Date.now()}`,
        walletAddress: WALLET,
        basePrice: 10,
        finalPrice: 8.80,
        conditions: [{ rule: { label: 'Gas', conditionType: 'gas' }, oracleValue: 0.001, matched: true, adjustmentBps: -200 }],
        locationJson: '{"lat":22.32,"lng":114.17}',
        astralProofUid: 'e2e-test',
      }),
    });
    if (!res.ok) throw new Error(`Attestation API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.txHash) throw new Error('No txHash');
    ok('Attestation created', `tx=${data.txHash.slice(0, 16)}...`);
  });

  await test('Attestation visible in explorer API', async () => {
    const res = await fetch(`${BASE}/api/attestation`);
    const data = await res.json();
    if (!data.attestations || data.attestations.length === 0) throw new Error('No attestations returned');
    ok('Attestations visible', `count=${data.attestations.length}`);
  });

  // ============================================
  console.log('\n=== HSP PAYMENT ORDER ===');
  // ============================================
  await test('HSP createOrder returns payment URL', async () => {
    const res = await fetch(`${BASE}/api/pay`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: WALLET, basePrice: 10, finalPrice: 8.80, conditions: [], locationJson: '', astralProofUid: '' }),
    });
    if (!res.ok) throw new Error(`Pay API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.paymentUrl) throw new Error('No payment URL');
    if (!data.paymentUrl.includes('hashkeymerchant.com')) throw new Error(`Bad URL: ${data.paymentUrl}`);
    ok('HSP order created', `url=${data.paymentUrl.slice(0, 50)}...`);
  });

  // ============================================
  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
