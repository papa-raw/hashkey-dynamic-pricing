# Dynamic Checkout

> Oracle-conditioned payment middleware on HashKey Chain. Every price is dynamic. Every price is provable.

![Dynamic Checkout Dashboard](frontend/public/screenshot-dashboard.png)

**Live demo:** [dynamic-checkout-mu.vercel.app](https://dynamic-checkout-mu.vercel.app)
**Track:** PayFi -- HashKey Chain Horizon Hackathon

---

## What it does

Merchants define pricing rules tied to real-world data feeds. When a customer pays, Dynamic Checkout:

1. **Queries 4 oracle feeds** -- gas price, wallet reputation, local time, jurisdiction
2. **Evaluates all merchant rules** -- best discount wins, or stack all (merchant chooses)
3. **Settles via HSP** -- USDC payment on HashKey Chain
4. **Attests the price onchain** -- permanent proof of the exact computation

A merchant offering cross-border payments sets a loyalty rule: 20% discount for wallets with 50+ transactions. A returning customer pays $8 instead of $10 -- and the onchain attestation records the exact rule that matched, the oracle value (67 txns), and how the final price was derived. Verifiable by anyone, permanently.

---

## Architecture

```
Customer connects wallet
        |
Browser collects GPS coordinates (or demo mode: Hong Kong)
        |
Server creates a signed location stamp (EIP-191, deployer wallet)
        |
Stamp + claim submitted to Astral's TEE verification API
  -> staging-api.astral.global/verify/v0/proof
  -> TEE evaluates stamp signatures, structure, temporal consistency
  -> TEE returns credibility score + signed EAS attestation
  -> evaluationMethod: "astral-v0.3.0-tee"
        |
4 Oracle feeds evaluate in parallel:
  |-- Gas Price      ->  block.basefee (network congestion)
  |-- Wallet Rep     ->  tx count on HashKey Chain (loyalty)
  |-- Time of Day    ->  local hour from verified location
  |-- Jurisdiction   ->  geofence from verified coordinates
        |
Rule engine evaluates all merchant rules against oracle data
  -> "Best discount wins" or "Stack all discounts" (merchant configurable)
        |
HSP settles USDC payment on HashKey Chain
  -> HMAC-SHA256 request signing + ES256K JWT merchant authorization
  -> HSP checkout hosted page, customer approves USDC transfer
  -> Routed through Cloudflare Worker proxy (HSP QA has bot detection)
        |
Customer redirected to success page
  -> Payment details read from localStorage
  -> /api/create-attestation called with full computation context
        |
Price proof attested onchain (ProofPayAttestation contract)
  -> base price, final price, conditions evaluated, oracle values, TEE proof UID
  -> tx hash returned, visible in attestation explorer
        |
HSP webhook (backup path)
  -> callbackUrl set in order creation
  -> /api/webhook receives payment confirmation
  -> Creates attestation if success page didn't already
```

---

## Astral Protocol -- TEE-Verified Location Proofs

Dynamic Checkout uses [Astral Protocol](https://docs.astral.global) for location verification. Here's what actually happens:

**Our implementation:**

1. Browser collects GPS coordinates via `navigator.geolocation` (or preset demo coordinates)
2. Our server creates a **signed stamp** -- the deployer wallet signs the location data (EIP-191)
3. Server submits a **claim** (location + subject + radius + time window) plus the **stamp** (signed evidence) to Astral's `/verify/v0/proof` endpoint
4. Astral's TEE evaluates the stamp: signature validity, structural integrity, temporal consistency
5. TEE returns a **credibility object** with dimensional scores (spatial, temporal, validity, independence) and a **signed EAS attestation** from Astral's TEE signer (`0x590fdb53...`)

**What the TEE actually verifies:**
- Stamp signature is valid and matches the claimed signer
- Stamp structure follows Location Protocol v0.2
- Temporal footprint is consistent with the claim's time window
- Spatial consistency between stamp location and claim location

**What it doesn't do (being honest):**
- Browser GPS can still be spoofed with mock location tools. The TEE verifies the stamp's signature and consistency, but cannot independently confirm the device was physically at the claimed coordinates.
- We submit one stamp (ip-geolocation plugin). A production deployment would submit multiple stamps from independent sources (ProofMode hardware attestation, WitnessChain network triangulation, WiFi-MLS) for higher-confidence cross-correlation.
- The credibility score reflects the quality and consistency of the evidence submitted, not absolute proof of physical presence.

**Why it still matters:** Every location claim is signed, timestamped, and TEE-evaluated with a credibility score. This is a meaningful step above raw self-reported GPS -- the TEE provides an independent evaluation that the claim is structurally valid and internally consistent. The attestation is signed by Astral's TEE key, not the user's wallet, creating a separation between claim and verification.

**Schema:** `0x9efcbaa4a39a233977a6db557fd81ba5adc9023ca731db86cfd562c4fbf4073e` (Astral Location Protocol v0.2)

---

## Oracle Feeds

| Feed | Source | What it measures | Example Rule |
|------|--------|-----------------|-------------|
| **Gas Price** | `block.basefee` | Network congestion | Gas < 10 gwei -> 30% off |
| **Wallet Reputation** | Transaction count | Customer loyalty | > 50 txns -> 20% off |
| **Time of Day** | Local hour from verified location | Peak vs off-peak | Midnight-6am -> 50% off |
| **Jurisdiction** | Geofence from verified coordinates | Regional compliance | Hong Kong -> 10% off |

---

## HSP Integration

Dynamic Checkout uses the HashKey Settlement Protocol for payment settlement with two authentication layers:

- **HMAC-SHA256** -- signs every API request (method, path, body hash, timestamp, nonce)
- **ES256K JWT** -- merchant authorization field with secp256k1 signature over cart hash

The HSP client uses Node's built-in `crypto` module for both layers -- no external JWT library needed (jose v6 dropped ES256K support, so we sign manually).

**Flow:**
1. Server creates HSP order (HMAC-signed request + ES256K JWT merchant auth)
2. Request routed through Cloudflare Worker proxy (`hsp-proxy.pat-ef5.workers.dev`) -- HSP's QA environment has Cloudflare bot detection that blocks datacenter IPs
3. Customer redirected to HSP's hosted checkout page
4. Customer approves USDC transfer on HashKey Chain
5. Customer returns to success page -> attestation created onchain
6. HSP webhook (backup) confirms payment status

**Attestation creation:** The success page triggers attestation creation immediately on return from HSP. Payment details (base price, final price, conditions, location proof UID) are persisted in localStorage before the HSP redirect and read back on the success page. This ensures the attestation includes the full computation context even though HSP's callback only provides the payment status.

---

## Deployed Contracts

HashKey Chain Testnet -- Chain ID 133

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
| Location Proofs | Astral Protocol TEE verification API, EAS |
| Oracle Feeds | block.basefee, tx count, Astral TEE location, geofence |

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
  app/
    page.tsx                 # Merchant dashboard + rule editor
    checkout/page.tsx        # Customer checkout flow
    attestations/page.tsx    # Price proof explorer
    api/
      price/route.ts         # Oracle evaluation + rule engine
      pay/route.ts           # HSP order creation
      location/route.ts      # Astral TEE verification
      webhook/route.ts       # HSP payment callback -> attestation
      attestation/route.ts   # Query onchain proofs
      rules/route.ts         # Merchant rule CRUD
  lib/
    hsp-client.ts            # HSP REST API (HMAC + ES256K JWT)
    oracle-adapters.ts       # 4 oracle feed adapters
    rule-engine.ts           # Best-discount or stacking evaluation
    astral-service.ts        # Legacy client-side Astral (kept for reference)
    constants.ts             # Contract addresses, ABIs, chain config
  components/                # PriceBreakdown, LocationProof, RuleEditor, etc.
  patches/                   # Astral SDK chain 133 support

contracts/
  ProofPayAttestation.sol    # Onchain price proof records
  HSPAdapter.sol             # Payment lifecycle tracking
  PriceRuleRegistry.sol      # Merchant pricing rules
```

---

## Team

**Patrick Rawson** -- [Ecofrontiers](https://ecofrontiers.xyz)

## License

MIT
