# Dynamic Checkout

**Oracle-conditioned payment middleware on HashKey Chain.**

Merchants define pricing rules tied to real-world data feeds — gas congestion, wallet reputation, time of day, geographic jurisdiction. When a customer pays, Dynamic Checkout evaluates all rules against live oracle data, computes the dynamic price, settles via HSP, and creates an onchain attestation proving exactly why the price was what it was.

**Every payment is dynamic. Every price is provable.**

## Hackathon

- **Event:** HashKey Chain Horizon Hackathon
- **Track:** PayFi
- **Built:** March-April 2026

## Architecture

```
Customer connects wallet
       ↓
Astral Protocol verifies location (EIP-712 offchain attestation)
       ↓
4 Oracle feeds evaluate:
  • Gas price (block.basefee)
  • Wallet reputation (tx count)
  • Time of day (local hour from location)
  • Jurisdiction (geofence from Astral proof)
       ↓
Rule engine applies best matching discount
       ↓
HSP settles payment (USDC on HashKey Chain)
       ↓
Price proof attested onchain (ProofPayAttestation contract)
```

## Deployed Contracts (HashKey Chain Testnet — Chain 133)

| Contract | Address | Purpose |
|----------|---------|---------|
| ProofPayAttestation | [`0x057Ac4C0FaaB720eBE9B60BDaBb3f55284429C34`](https://testnet-explorer.hsk.xyz/address/0x057Ac4C0FaaB720eBE9B60BDaBb3f55284429C34) | Onchain price proof records |
| HSPAdapter | [`0x688eb62266644EF575126a08e14E74De77590780`](https://testnet-explorer.hsk.xyz/address/0x688eb62266644EF575126a08e14E74De77590780) | Payment lifecycle tracking |
| PriceRuleRegistry | [`0xb42D12B5AF3A2d0F59637CF6BF6CC43f9C2B4f9f`](https://testnet-explorer.hsk.xyz/address/0xb42D12B5AF3A2d0F59637CF6BF6CC43f9C2B4f9f) | Merchant pricing rules |

EAS (Ethereum Attestation Service) is available at the OP Stack predeploy `0x4200000000000000000000000000000000000021`. Astral Protocol schema registered with UID `0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2`.

## Tech Stack

- **Smart Contracts:** Solidity 0.8.20 (Hardhat)
- **Frontend:** Next.js 15, React 19, Tailwind CSS, framer-motion
- **Wallet:** wagmi v2, RainbowKit, viem
- **Payments:** HSP (HashKey Settlement Protocol) — REST API with HMAC-SHA256 + ES256K JWT auth
- **Location Proofs:** Astral Protocol SDK — EIP-712 offchain attestations via EAS
- **Oracle Feeds:** Gas price (block.basefee), wallet reputation (tx count), timezone (Astral location), jurisdiction (geofence)

## Setup

```bash
# Contracts
cd hashkey
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network hashkeyTestnet
npx hardhat run scripts/seed-rules.ts --network hashkeyTestnet

# Frontend
cd frontend
npm install          # patch-package runs automatically via postinstall
cp .env.example .env.local
# Fill in credentials (HSP keys, deployer key, contract addresses)
npm run dev
```

## HSP Integration

Dynamic Checkout uses the HashKey Settlement Protocol for payment settlement. Two auth layers:

1. **HMAC-SHA256** — signs every API request (method, path, body hash, timestamp, nonce)
2. **ES256K JWT** — `merchant_authorization` field with secp256k1 signature over cart hash

The HSP client (`lib/hsp-client.ts`) implements both layers using Node's built-in `crypto` module. No external JWT library needed (jose v6 dropped ES256K support).

## Astral Protocol on HashKey Chain

EAS is pre-deployed on HashKey Chain (OP Stack predeploy at `0x4200...0021`). We registered the Astral location schema natively on chain 133, enabling real EIP-712 location proofs without chain ID mismatches.

The Astral SDK required a patch to add chain 133 to its config — this is applied automatically via `patch-package` on `npm install`.

## What Was Built During the Hackathon

- 3 Solidity contracts (ProofPayAttestation, HSPAdapter, PriceRuleRegistry)
- HSP REST API client with dual auth (HMAC + ES256K JWT)
- 4 oracle adapters (gas, reputation, timezone, jurisdiction)
- Rule engine with best-discount stacking
- Astral Protocol integration with EAS on HashKey Chain
- Next.js frontend with merchant dashboard, checkout flow, attestation explorer
- Deployed and verified on HashKey Chain testnet (chain 133)

## AI Tools Disclosure

This project was built with assistance from Claude Code (Anthropic). The developer directed architecture, made all design decisions, and verified all integrations. AI assisted with code generation, debugging, and research.

## Team

**Patrick Rawson** — Ecofrontiers (ecofrontiers.xyz)
**Louise Borreani** — Ecofrontiers

## License

MIT
