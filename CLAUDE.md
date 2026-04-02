# Dynamic Checkout — HashKey Chain Hackathon

Oracle-conditioned payment middleware where every price is dynamic and cryptographically provable.

## How It Works

1. Customer connects wallet + submits location (GPS or demo mode)
2. Server creates signed location stamp, TEE verifies via Astral Protocol
3. 4 oracle feeds evaluate in parallel (gas, reputation, time, jurisdiction)
4. Rule engine applies merchant pricing rules (best discount or stack all)
5. HSP settles USDC payment on HashKey Chain
6. Price proof attested onchain with full computation trail

## Tech Stack

- **Contracts:** Solidity 0.8.20, Hardhat, Blockscout verification
- **Frontend:** Next.js 15, React 19, Tailwind, Framer Motion
- **Wallet:** wagmi v2, RainbowKit, viem
- **Payments:** HSP REST API (HMAC-SHA256 + ES256K JWT signing)
- **Location:** Astral Protocol TEE (EAS attestations)
- **Oracles:** block.basefee, transaction count, location-based time, geofence jurisdiction

## Commands

```bash
npm install && npx hardhat compile
npx hardhat run scripts/deploy-test.ts --network hashkeyTestnet
cd frontend && npm install && npm run dev
```

## Deployed Contracts (HashKey Testnet, Chain ID 133)

- ProofPayAttestation: `0x057Ac4C0FaaB720eBE9B60BDaBb3f55284429C34`
- HSPAdapter: `0x688eb62266644EF575126a08e14E74De77590780`
- PriceRuleRegistry: `0xb42D12B5AF3A2d0F59637CF6BF6CC43f9C2B4f9f`

## Key Decisions

- TEE location verification via Astral — honest docs on TEE limitations included
- Demo mode for GPS-less environments
- USDC settlement on HashKey Chain
