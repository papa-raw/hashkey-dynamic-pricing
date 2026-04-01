import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();

const RPC = 'https://testnet.hsk.xyz';
const ATTESTATION = '0x057Ac4C0FaaB720eBE9B60BDaBb3f55284429C34';
const ABI = ['function createProof(address payer, uint256 basePrice, uint256 finalPrice, string conditionsJson, string locationJson, bytes32 astralProofUid, bytes32 hspRequestId) returns (bytes32 proofId)'];

// Test wallet as payer
const PAYER = '0xC4d9d1a93068d311Ab18E988244123430eB4F1CD';

const SCENARIOS = [
  {
    base: 5.00, final: 3.50, location: '{"lat":22.32,"lng":114.17}',
    conditions: [{ rule: { label: 'Low congestion: 30% off', conditionType: 'gas' }, oracleValue: 1.8, matched: true, adjustmentBps: -3000 }],
  },
  {
    base: 4.00, final: 2.00, location: '{"lat":22.28,"lng":114.15}',
    conditions: [{ rule: { label: 'Off-peak (midnight-6am): 50% off', conditionType: 'time' }, oracleValue: 3, matched: true, adjustmentBps: -5000 }],
  },
  {
    base: 3.50, final: 2.80, location: '{"lat":1.35,"lng":103.82}',
    conditions: [{ rule: { label: 'Loyalty (50+ txns): 20% off', conditionType: 'reputation' }, oracleValue: 67, matched: true, adjustmentBps: -2000 }],
  },
  {
    base: 6.00, final: 5.40, location: '{"lat":22.30,"lng":114.18}',
    conditions: [{ rule: { label: 'HK jurisdiction: 10% off', conditionType: 'location' }, oracleValue: 1, matched: true, adjustmentBps: -1000 }],
  },
  {
    base: 4.50, final: 3.15, location: '{"lat":35.68,"lng":139.76}',
    conditions: [{ rule: { label: 'Low congestion: 30% off', conditionType: 'gas' }, oracleValue: 2.3, matched: true, adjustmentBps: -3000 }],
  },
  {
    base: 3.00, final: 1.50, location: '{"lat":52.52,"lng":13.40}',
    conditions: [{ rule: { label: 'Off-peak (midnight-6am): 50% off', conditionType: 'time' }, oracleValue: 4, matched: true, adjustmentBps: -5000 }],
  },
  {
    base: 5.50, final: 4.40, location: '{"lat":40.71,"lng":-74.01}',
    conditions: [{ rule: { label: 'Loyalty (50+ txns): 20% off', conditionType: 'reputation' }, oracleValue: 112, matched: true, adjustmentBps: -2000 }],
  },
  {
    base: 4.00, final: 4.00, location: '{}',
    conditions: [{ rule: { label: 'Low congestion: 30% off', conditionType: 'gas' }, oracleValue: 42, matched: false, adjustmentBps: 0 }],
  },
  {
    base: 7.00, final: 4.90, location: '{"lat":22.31,"lng":114.16}',
    conditions: [{ rule: { label: 'Low congestion: 30% off', conditionType: 'gas' }, oracleValue: 0.9, matched: true, adjustmentBps: -3000 }],
  },
  {
    base: 3.00, final: 2.70, location: '{"lat":22.29,"lng":114.19}',
    conditions: [{ rule: { label: 'HK jurisdiction: 10% off', conditionType: 'location' }, oracleValue: 1, matched: true, adjustmentBps: -1000 }],
  },
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);
  const contract = new ethers.Contract(ATTESTATION, ABI, wallet);

  console.log('Creating 10 realistic attestations (~$3-7 each)...\n');

  for (let i = 0; i < SCENARIOS.length; i++) {
    const s = SCENARIOS[i];
    const baseWei = ethers.parseUnits(s.base.toFixed(2), 6);
    const finalWei = ethers.parseUnits(s.final.toFixed(2), 6);
    const condJson = JSON.stringify(s.conditions);
    const hspReqId = ethers.id(`hsp-pay-${Date.now()}-${i}`);
    const astralUid = ethers.id(`astral-${Date.now()}-${i}`);

    try {
      const tx = await contract.createProof(PAYER, baseWei, finalWei, condJson, s.location, astralUid, hspReqId);
      const r = await tx.wait();
      const matched = s.conditions.find((c: any) => c.matched);
      const discount = s.base > s.final ? `-${Math.round(((s.base - s.final) / s.base) * 100)}%` : 'none';
      console.log(`[${i+1}/10] $${s.base.toFixed(2)} → $${s.final.toFixed(2)} (${discount}) ${matched?.rule?.label || 'no match'} — tx: ${r!.hash.slice(0,14)}...`);
    } catch (err: any) {
      console.error(`[${i+1}/10] FAILED:`, err.message);
    }
  }

  console.log('\nDone.');
}

main().catch(console.error);
