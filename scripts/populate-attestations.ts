// Populate attestations page with 10 varied test proofs onchain
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();

const RPC = 'https://testnet.hsk.xyz';
const ATTESTATION_ADDRESS = '0x057Ac4C0FaaB720eBE9B60BDaBb3f55284429C34';
const ABI = [
  'function createProof(address payer, uint256 basePrice, uint256 finalPrice, string conditionsJson, string locationJson, bytes32 astralProofUid, bytes32 hspRequestId) returns (bytes32 proofId)',
];

const SCENARIOS = [
  { base: 10, final: 5, conditions: [{ rule: { label: 'Off-peak (midnight-6am): 50% off', conditionType: 'time' }, oracleValue: 3, matched: true, adjustmentBps: -5000 }], location: '{"lat":22.32,"lng":114.17}', note: 'HK off-peak' },
  { base: 25, final: 17.5, conditions: [{ rule: { label: 'Low congestion: 30% off', conditionType: 'gas' }, oracleValue: 2.1, matched: true, adjustmentBps: -3000 }], location: '{"lat":22.28,"lng":114.15}', note: 'HK low gas' },
  { base: 100, final: 80, conditions: [{ rule: { label: 'Loyalty (50+ txns): 20% off', conditionType: 'reputation' }, oracleValue: 147, matched: true, adjustmentBps: -2000 }], location: '{"lat":1.35,"lng":103.82}', note: 'Singapore loyalty' },
  { base: 50, final: 45, conditions: [{ rule: { label: 'HK jurisdiction: 10% off', conditionType: 'location' }, oracleValue: 1, matched: true, adjustmentBps: -1000 }], location: '{"lat":22.30,"lng":114.18}', note: 'HK jurisdiction' },
  { base: 15, final: 7.5, conditions: [{ rule: { label: 'Off-peak (midnight-6am): 50% off', conditionType: 'time' }, oracleValue: 2, matched: true, adjustmentBps: -5000 }], location: '{"lat":35.68,"lng":139.76}', note: 'Tokyo off-peak' },
  { base: 200, final: 140, conditions: [{ rule: { label: 'Low congestion: 30% off', conditionType: 'gas' }, oracleValue: 1.5, matched: true, adjustmentBps: -3000 }], location: '{"lat":51.51,"lng":-0.12}', note: 'London low gas' },
  { base: 75, final: 60, conditions: [{ rule: { label: 'Loyalty (50+ txns): 20% off', conditionType: 'reputation' }, oracleValue: 89, matched: true, adjustmentBps: -2000 }], location: '{"lat":40.71,"lng":-74.01}', note: 'NYC loyalty' },
  { base: 30, final: 15, conditions: [{ rule: { label: 'Off-peak (midnight-6am): 50% off', conditionType: 'time' }, oracleValue: 4, matched: true, adjustmentBps: -5000 }], location: '{"lat":52.52,"lng":13.40}', note: 'Berlin off-peak' },
  { base: 500, final: 350, conditions: [{ rule: { label: 'Low congestion: 30% off', conditionType: 'gas' }, oracleValue: 0.8, matched: true, adjustmentBps: -3000 }], location: '{"lat":22.31,"lng":114.16}', note: 'HK large order' },
  { base: 10, final: 10, conditions: [{ rule: { label: 'Low congestion: 30% off', conditionType: 'gas' }, oracleValue: 45, matched: false, adjustmentBps: 0 }], location: '{}', note: 'No discount (high gas)' },
];

const PAYERS = [
  '0x1234567890abcdef1234567890abcdef12345678',
  '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  '0x9876543210fedcba9876543210fedcba98765432',
  '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
  '0xcafebabecafebabecafebabecafebabecafebabe',
  '0x1111222233334444555566667777888899990000',
  '0xaabbccddeeff00112233445566778899aabbccdd',
  '0x5555aaaa5555aaaa5555aaaa5555aaaa5555aaaa',
  '0x0123456789abcdef0123456789abcdef01234567',
  '0xfedcba9876543210fedcba9876543210fedcba98',
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);
  const contract = new ethers.Contract(ATTESTATION_ADDRESS, ABI, wallet);

  console.log('Deployer:', wallet.address);
  console.log('Balance:', ethers.formatEther(await provider.getBalance(wallet.address)), 'HSK');
  console.log(`\nCreating ${SCENARIOS.length} attestations...\n`);

  for (let i = 0; i < SCENARIOS.length; i++) {
    const s = SCENARIOS[i];
    const payer = PAYERS[i];
    const baseWei = ethers.parseUnits(s.base.toString(), 6);
    const finalWei = ethers.parseUnits(s.final.toString(), 6);
    const condJson = JSON.stringify(s.conditions);
    const astralUid = ethers.id(`astral-proof-${i}-${Date.now()}`);
    const hspReqId = ethers.id(`hsp-req-${i}-${Date.now()}`);

    try {
      const tx = await contract.createProof(payer, baseWei, finalWei, condJson, s.location, astralUid, hspReqId);
      const receipt = await tx.wait();
      console.log(`[${i + 1}/10] ${s.note} — $${s.base} → $${s.final} — tx: ${receipt!.hash.slice(0, 14)}...`);
    } catch (err: any) {
      console.error(`[${i + 1}/10] FAILED: ${err.message}`);
    }
  }

  console.log('\nDone. Attestations page should now show 10 proofs.');
}

main().catch(console.error);
