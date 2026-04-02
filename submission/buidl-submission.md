# DoraHacks BUIDL Submission

## BUIDL Name
Dynamic Checkout

## BUIDL Logo
Use: `frontend/public/logo.svg` (convert to PNG 480x480)
Or use: screenshot-dashboard.png cropped

## Vision

Merchants today set static prices — the same amount regardless of network conditions, customer loyalty, time of day, or geographic jurisdiction. Dynamic Checkout solves this by letting merchants define pricing rules tied to real-time oracle feeds. When a customer pays, four oracles evaluate simultaneously (gas congestion, prior payment history, local time, TEE-verified jurisdiction), the rule engine computes the optimal price, HSP settles the USDC payment on HashKey Chain, and an onchain attestation permanently records why the price was what it was. Every discount is transparent, every computation is provable, every proof is auditable.

## Category
No (not an AI Agent)

## Links

**GitHub:** https://github.com/papa-raw/hashkey-dynamic-pricing

**Project website:** https://dynamic-checkout-mu.vercel.app

**Demo video:** [TO BE RECORDED]

## Social Links
1. https://x.com/ecaboreal
2. https://ecofrontiers.xyz
3. https://linkedin.com/in/pat-rawson-48306867

---

## Full Description (for the description field)

### What it does

Dynamic Checkout is oracle-conditioned payment middleware on HashKey Chain. Merchants define pricing rules tied to real-world data feeds — gas congestion, customer loyalty, time of day, and TEE-verified geographic jurisdiction. Every payment is dynamically priced and permanently attested onchain.

### How it works

1. Customer connects wallet at checkout
2. Astral Protocol creates a TEE-verified location proof (signed stamp submitted to Astral's verification API, evaluated inside a Trusted Execution Environment, credibility-scored result returned as an EAS attestation)
3. Four oracle feeds evaluate: gas price from block.basefee, loyalty from prior payment count via ProofPayAttestation events, local time from the client, jurisdiction from TEE-verified geofence
4. Rule engine applies the best matching discount or stacks all discounts (merchant configurable)
5. HSP settles USDC payment on HashKey Chain (dual auth: HMAC-SHA256 + ES256K JWT)
6. Price proof attested onchain with full computation record

### Key integrations

- **HSP (HashKey Settlement Protocol)** — real API integration with HMAC-SHA256 request signing and ES256K JWT merchant authorization. Routed through Cloudflare Worker proxy for production deployment.
- **Astral Protocol TEE verification** — location stamps submitted to staging-api.astral.global/verify/v0/proof, evaluated inside Astral's TEE (evaluationMethod: astral-v0.3.0-tee), credibility-scored and signed by Astral's TEE key.
- **EAS on HashKey Chain** — Ethereum Attestation Service pre-deployed at OP Stack predeploy. Astral location schema registered natively on chain 133.

### Deployed contracts (HashKey Chain Testnet, Chain 133)

- ProofPayAttestation: 0x057Ac4C0FaaB720eBE9B60BDaBb3f55284429C34
- HSPAdapter: 0x688eb62266644EF575126a08e14E74De77590780
- PriceRuleRegistry: 0xb42D12B5AF3A2d0F59637CF6BF6CC43f9C2B4f9f

All contracts verified on Blockscout.

### Tech stack

Solidity 0.8.20, Hardhat, Next.js 15, React 19, Tailwind CSS, Framer Motion, wagmi v2, RainbowKit, viem, ethers.js, Astral Protocol SDK, EAS, Cloudflare Workers, Vercel.

### E2E test results

16/16 passed: all 4 oracle rules (gas, loyalty, time, jurisdiction), stacking mode, TEE verification, attestation creation, HSP payment orders.

### What was built during the hackathon

Everything. All 3 contracts, HSP client with dual auth, 4 oracle adapters, rule engine with stacking modes, Astral TEE verification integration, Cloudflare Worker proxy, full Next.js frontend (merchant dashboard, checkout flow, attestation explorer), E2E test suite. EAS schema registered on chain 133. Astral SDK patched to support HashKey Chain.

### Team

Patrick Rawson — Ecofrontiers (ecofrontiers.xyz)
