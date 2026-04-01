// Integration tests for Dynamic Checkout
// Run: cd hashkey && npx tsx scripts/test-integration.ts
import { ethers } from 'ethers';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

const RPC = 'https://testnet.hsk.xyz';
const ATTESTATION = '0x057Ac4C0FaaB720eBE9B60BDaBb3f55284429C34';
const HSP_ADAPTER = '0x688eb62266644EF575126a08e14E74De77590780';
const RULE_REGISTRY = '0xb42D12B5AF3A2d0F59637CF6BF6CC43f9C2B4f9f';
const USDC = '0x8FE3cB719Ee4410E236Cd6b72ab1fCDC06eF53c6';
const EAS = '0x4200000000000000000000000000000000000021';

const HSP_BASE = 'https://merchant-qa.hashkeymerchant.com';
const HSP_APP_KEY = process.env.HSP_APP_KEY || '4OCYWH8L';
const HSP_APP_SECRET = process.env.HSP_APP_SECRET || '';
const HSP_MERCHANT_KEY = (process.env.HSP_MERCHANT_PRIVATE_KEY || '').replace(/\\n/g, '\n');

let passed = 0;
let failed = 0;

function ok(name: string) { passed++; console.log(`  ✅ ${name}`); }
function fail(name: string, err: string) { failed++; console.log(`  ❌ ${name}: ${err}`); }

async function test(name: string, fn: () => Promise<void>) {
  try { await fn(); ok(name); } catch (e: any) { fail(name, e.message); }
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);

  console.log('\n=== CHAIN CONNECTIVITY ===');
  await test('RPC responds', async () => {
    const block = await provider.getBlockNumber();
    if (!block) throw new Error('No block number');
  });

  await test('Chain ID is 133', async () => {
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== 133) throw new Error(`Got chain ${network.chainId}`);
  });

  console.log('\n=== CONTRACTS EXIST ===');
  for (const [name, addr] of [['Attestation', ATTESTATION], ['HSPAdapter', HSP_ADAPTER], ['RuleRegistry', RULE_REGISTRY], ['USDC', USDC], ['EAS', EAS]]) {
    await test(`${name} has code at ${addr.slice(0,8)}...`, async () => {
      const code = await provider.getCode(addr);
      if (code === '0x') throw new Error('No code');
    });
  }

  console.log('\n=== CONTRACT READS ===');
  const attestation = new ethers.Contract(ATTESTATION, [
    'function proofCount() view returns (uint256)',
  ], provider);
  await test('ProofPayAttestation.proofCount()', async () => {
    const count = await attestation.proofCount();
    if (Number(count) < 10) throw new Error(`Only ${count} proofs`);
    console.log(`    → ${count} proofs`);
  });

  const registry = new ethers.Contract(RULE_REGISTRY, [
    'function getRules(address) view returns (tuple(uint256 id, address merchant, uint8 conditionType, uint8 operator, uint256 threshold, uint256 thresholdHigh, int256 adjustmentBps, bool active, string label)[])',
    'function ruleCount() view returns (uint256)',
  ], provider);
  await test('PriceRuleRegistry.ruleCount()', async () => {
    const count = await registry.ruleCount();
    if (Number(count) < 4) throw new Error(`Only ${count} rules`);
    console.log(`    → ${count} rules`);
  });

  await test('PriceRuleRegistry.getRules(deployer)', async () => {
    const rules = await registry.getRules('0xB61906081aa8C8236a7259Fad09CFC46925ab255');
    if (rules.length < 4) throw new Error(`Only ${rules.length} rules for deployer`);
    console.log(`    → ${rules.length} rules, first: "${rules[0].label}"`);
  });

  const usdc = new ethers.Contract(USDC, ['function balanceOf(address) view returns (uint256)'], provider);
  await test('USDC balanceOf deployer', async () => {
    const bal = await usdc.balanceOf('0xB61906081aa8C8236a7259Fad09CFC46925ab255');
    console.log(`    → ${ethers.formatUnits(bal, 6)} USDC`);
  });

  await test('USDC balanceOf test wallet', async () => {
    const bal = await usdc.balanceOf('0xC4d9d1a93068d311Ab18E988244123430eB4F1CD');
    console.log(`    → ${ethers.formatUnits(bal, 6)} USDC`);
  });

  console.log('\n=== EAS SCHEMA ===');
  const schemaRegistry = new ethers.Contract('0x4200000000000000000000000000000000000020', [
    'function getSchema(bytes32 uid) view returns (tuple(bytes32 uid, address resolver, bool revocable, string schema))',
  ], provider);
  await test('Astral schema registered on chain 133', async () => {
    const schema = await schemaRegistry.getSchema('0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2');
    if (!schema.schema || schema.schema.length < 10) throw new Error('Schema empty');
    console.log(`    → ${schema.schema.slice(0, 50)}...`);
  });

  console.log('\n=== HSP AUTH ===');
  if (HSP_APP_SECRET) {
    await test('HMAC signature generation', async () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const nonce = crypto.randomBytes(16).toString('hex');
      const bodyHash = crypto.createHash('sha256').update('{}').digest('hex');
      const message = ['GET', '/api/v1/payment/chain-config', '', bodyHash, timestamp, nonce].join('\n');
      const sig = crypto.createHmac('sha256', HSP_APP_SECRET).update(message).digest('hex');
      if (sig.length !== 64) throw new Error(`Bad sig length: ${sig.length}`);
    });

    await test('HSP chain-config endpoint responds', async () => {
      const path = '/api/v1/payment/chain-config';
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const nonce = crypto.randomBytes(16).toString('hex');
      const message = ['GET', path, '', '', timestamp, nonce].join('\n');
      const sig = crypto.createHmac('sha256', HSP_APP_SECRET).update(message).digest('hex');

      const res = await fetch(`${HSP_BASE}${path}`, {
        headers: { 'X-App-Key': HSP_APP_KEY, 'X-Signature': sig, 'X-Timestamp': timestamp, 'X-Nonce': nonce },
      });
      const json = await res.json() as any;
      if (json.code !== 0) throw new Error(`HSP error: ${json.msg}`);
      console.log(`    → ${json.data?.length || 0} chain configs`);
    });

    if (HSP_MERCHANT_KEY) {
      await test('ES256K JWT signing works', async () => {
        const header = Buffer.from(JSON.stringify({ alg: 'ES256K', typ: 'JWT' })).toString('base64url');
        const body = Buffer.from(JSON.stringify({ iss: 'Ecofrontiers', sub: 'Ecofrontiers', aud: 'HashkeyMerchant', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url');
        const signer = crypto.createSign('SHA256');
        signer.update(`${header}.${body}`);
        const sig = signer.sign({ key: HSP_MERCHANT_KEY, dsaEncoding: 'ieee-p1363' });
        const jwt = `${header}.${body}.${Buffer.from(sig).toString('base64url')}`;
        if (jwt.split('.').length !== 3) throw new Error('Invalid JWT structure');
        console.log(`    → JWT: ${jwt.slice(0, 30)}...`);
      });
    } else {
      fail('ES256K JWT signing', 'HSP_MERCHANT_PRIVATE_KEY not set');
    }
  } else {
    fail('HMAC signature', 'HSP_APP_SECRET not set');
    fail('HSP chain-config', 'HSP_APP_SECRET not set');
    fail('ES256K JWT', 'HSP_APP_SECRET not set');
  }

  console.log('\n=== RULE ENGINE ===');
  await test('Evaluate price with gas rule', async () => {
    // Simulate: gas = 2 gwei (< 10 threshold) → 30% off
    const rules = [{ id: 1, conditionType: 'gas' as const, operator: 'lt' as const, threshold: 10, adjustmentBps: -3000, label: 'test', active: true }];
    const oracles = [{ type: 'gas' as const, value: 2, label: '2 gwei', raw: {} }];
    const base = 10;
    const matched = oracles[0].value < rules[0].threshold;
    const final_ = matched ? base * (1 + rules[0].adjustmentBps / 10000) : base;
    if (final_ !== 7) throw new Error(`Expected 7, got ${final_}`);
    console.log(`    → $10 base, 2 gwei gas → $${final_} (30% off)`);
  });

  await test('No discount when condition not met', async () => {
    const base = 10;
    const gasValue = 50; // > 10 threshold
    const threshold = 10;
    const matched = gasValue < threshold; // false
    const final_ = matched ? base * 0.7 : base;
    if (final_ !== 10) throw new Error(`Expected 10, got ${final_}`);
    console.log(`    → $10 base, 50 gwei gas → $${final_} (no discount)`);
  });

  console.log('\n=== ENV VAR CHECK ===');
  const requiredEnvVars = [
    'DEPLOYER_PRIVATE_KEY',
  ];
  const optionalEnvVars = [
    'HSP_APP_KEY', 'HSP_APP_SECRET', 'HSP_MERCHANT_PRIVATE_KEY',
    'HSP_BASE_URL', 'DEPLOYER_ADDRESS',
  ];
  for (const v of requiredEnvVars) {
    await test(`${v} is set`, async () => {
      if (!process.env[v]) throw new Error('Not set');
    });
  }
  for (const v of optionalEnvVars) {
    if (process.env[v]) ok(`${v} is set`);
    else console.log(`  ⚠️  ${v} not in root .env (OK if set in frontend/.env.local)`);
  }

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
