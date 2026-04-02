# Dynamic Checkout

> Oracle-conditioned payment middleware on HashKey Chain. Every price is dynamic. Every price is provable.

![Dynamic Checkout Dashboard](frontend/public/screenshot-dashboard.png)

**Live demo:** [dynamic-checkout-mu.vercel.app](https://dynamic-checkout-mu.vercel.app)
**Track:** PayFi — HashKey Chain Horizon Hackathon

---

## What it does

Merchants define pricing rules tied to real-world data feeds. When a customer pays, Dynamic Checkout:

1. **Queries 4 oracle feeds** — gas price, wallet reputation, local time, jurisdiction
2. **Evaluates all merchant rules** — best discount wins, or stack all (merchant chooses)
3. **Settles via HSP** — USDC payment on HashKey Chain
4. **Attests the price onchain** — permanent proof of the exact computation

A merchant offering cross-border payments sets a loyalty rule: 20% discount for wallets with 50+ transactions. A returning customer pays $8 instead of $10 — and the onchain attestation records the exact rule that matched, the oracle value (67 txns), and how the final price was derived. Verifiable by anyone, permanently.

---

## Architecture

```
Customer connects wallet
        ↓
Astral Protocol creates location proof (EIP-712 offchain attestation via EAS)
        ↓
4 Oracle feeds evaluate in parallel:
  ├─ Gas Price      →  block.basefee (network congestion)
  ├─ Wallet Rep     →  tx count on HashKey Chain (loyalty)
  ├─ Time of Day    →  local hour from Astral location (off-peak pricing)
  └─ Jurisdiction   →  geofence from GPS coordinates (regional rules)
        ↓
Rule engine evaluates all merchant rules against oracle data
  → "Best discount wins" or "Stack all discounts" (merchant configurable)
        ↓
HSP settles USDC payment on HashKey Chain
  → HMAC-SHA256 request signing + ES256K JWT merchant authorization
        ↓
Price proof attested onchain (ProofPayAttestation contract)
  → base price, final price, conditions evaluated, oracle values, location proof UID
```

---

## Oracle Feeds

| Feed | Source | What it measures | Example Rule |
|------|--------|-----------------|-------------|
| **Gas Price** | `block.basefee` | Network congestion | Gas < 10 gwei → 30% off |
| **Wallet Reputation** | Transaction count | Customer loyalty | > 50 txns → 20% off |
| **Time of Day** | Local hour via Astral | Peak vs off-peak | Midnight-6am → 50% off |
| **Jurisdiction** | Astral Protocol geofence | Regional compliance | Hong Kong → 10% off |

---

## Astral Protocol on HashKey Chain

Dynamic Checkout uses [Astral Protocol](https://docs.astral.global) for cryptographic location proofs. When a customer checks out, Astral creates an EIP-712 offchain attestation via the Ethereum Attestation Service (EAS) proving their GPS coordinates at payment time.

**Why this matters for PayFi:** Location-aware pricing requires proof that the customer was actually in the jurisdiction claimed. Without Astral, a merchant's "HK residents get 10% off" rule is unverifiable. With Astral, the location proof is cryptographically signed and referenced in the onchain attestation.

**HashKey Chain integration:**
- EAS is pre-deployed at the OP Stack predeploy address (`0x4200...0021`)
- Astral location schema registered natively on chain 133 (UID: `0xba4171...c824e2`)
- SDK patched via `patch-package` to support chain 133 (applied automatically on `npm install`)

---

## HSP Integration

Dynamic Checkout uses the HashKey Settlement Protocol for payment settlement with two authentication layers:

- **HMAC-SHA256** — signs every API request (method, path, body hash, timestamp, nonce)
- **ES256K JWT** — merchant authorization field with secp256k1 signature over cart hash

The HSP client uses Node's built-in `crypto` module for both layers — no external JWT library needed (jose v6 dropped ES256K support, so we sign manually).

**Flow:** Create order → customer redirected to HSP checkout → customer approves USDC → HSP settles onchain → webhook confirms → attestation created.

---

## Deployed Contracts

HashKey Chain Testnet — Chain ID 133

| Contract | Address | Explorer |
|----------|---------|----------|
| ProofPayAttestation | `0x057Ac4C0FaaB720eBE9B60BDaBb3f55284429C34` | [View](https://testnet-explorer.hsk.xyz/address/0x057Ac4C0FaaB720eBE9B60BDaBb3f55284429C34) |
| HSPAdapter | `0x688eb62266644EF575126a08e14E74De77590780` | [View](https://testnet-explorer.hsk.xyz/address/0x688eb62266644EF575126a08e14E74De77590780) |
| PriceRuleRegistry | `0xb42D12B5AF3A2d0F59637CF6BF6CC43f9C2B4f9f` | [View](https://testnet-explorer.hsk.xyz/address/0xb42D12B5AF3A2d0F59637CF6BF6CC43f9C2B4f9f) |

All contracts verified on Blockscout. EAS Schema UID: `0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.20, Hardhat, verified on Blockscout |
| Frontend | Next.js 15, React 19, Tailwind CSS, Framer Motion |
| Wallet | wagmi v2, RainbowKit, viem |
| Payments | HSP REST API (HMAC-SHA256 + ES256K JWT) |
| Location Proofs | Astral Protocol SDK, EAS (EIP-712 offchain attestations) |
| Oracle Feeds | block.basefee, tx count, Astral location, geofence |

---

## Setup

```bash
# Contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy-test.ts --network hashkeyTestnet

# Frontend
cd frontend
npm install        # patch-package applies Astral SDK chain 133 config automatically
cp .env.example .env.local
# Add HSP credentials, deployer key, contract addresses
npm run dev
```

---

## File Structure

```
frontend/
├── app/
│   ├── page.tsx                 # Merchant dashboard + rule editor
│   ├── checkout/page.tsx        # Customer checkout flow
│   ├── attestations/page.tsx    # Price proof explorer
│   └── api/
│       ├── price/route.ts       # Oracle evaluation + rule engine
│       ├── pay/route.ts         # HSP order creation
│       ├── webhook/route.ts     # HSP payment callback → attestation
│       ├── attestation/route.ts # Query onchain proofs
│       └── rules/route.ts      # Merchant rule CRUD
├── lib/
│   ├── hsp-client.ts            # HSP REST API (HMAC + ES256K JWT)
│   ├── oracle-adapters.ts       # 4 oracle feed adapters
│   ├── rule-engine.ts           # Best-discount or stacking evaluation
│   ├── astral-service.ts        # Location proofs via EAS
│   └── constants.ts             # Contract addresses, ABIs, chain config
├── components/                  # PriceBreakdown, LocationProof, RuleEditor, etc.
└── patches/                     # Astral SDK chain 133 support

contracts/
├── ProofPayAttestation.sol      # Onchain price proof records
├── HSPAdapter.sol               # Payment lifecycle tracking
└── PriceRuleRegistry.sol        # Merchant pricing rules
```

---

## Team

**Patrick Rawson** — [Ecofrontiers](https://ecofrontiers.xyz)

## License

MIT
