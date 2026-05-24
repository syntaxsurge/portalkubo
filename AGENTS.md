# PortalKubo Agent Guide

After each task, provide a one-line GitHub commit message focused only on the
latest prompt and response.

## Platform Summary

PortalKubo is a Portaldot Mini Hackathon MVP for the **AI-Powered Onchain
Workflows** track. The product keeps the full paid API marketplace, provider
dashboard, buyer order flow, managed credits, autonomous agent runner, receipt
records, public proof pages, admin operations, and Convex backend from the
original app surface.

The Portaldot-native blockchain loop is:

1. Configure a Portaldot local node or RPC with `NEXT_PUBLIC_PORTALDOT_WS_URL`.
2. Run AI agent workflows against the marketplace and Convex-backed records.
3. Hash the workflow proof payload.
4. Anchor the proof with a native Portaldot `system.remark` extrinsic that pays
   gas in POT.
5. Display the proof hash, extrinsic hash, and explorer link on proof pages.

## Pages

- `/` - marketing homepage using the existing logo, color palette, and product
  positioning.
- `/marketplace` - buyer-facing paid API catalog.
- `/orders` and `/orders/[orderId]` - buyer order lifecycle and paid response
  flow.
- `/provider` - provider dashboard, products, usage, and earnings views.
- `/agents` - autonomous AI workflow creation, execution, receipts, and proof
  anchoring.
- `/proofs/[proofId]` - public proof summary with receipt rollups and on-chain
  attestation link.
- `/admin` - admin moderation, receipts, products, orders, agents, and
  operational readiness.
- `/demo-video` and `/pitch-deck` - optional redirects controlled by
  `DEMO_VIDEO_URL` and `PITCH_DECK_URL`.

## Portaldot Integration

- Portaldot runtime configuration lives in `src/lib/portaldot/config.ts`.
- Default local RPC: `ws://127.0.0.1:9944`.
- Local node command: `portaldot_dev --dev --alice`.
- SS58 format: `42`.
- Native gas token: `POT`.
- Token decimals: `14`.
- Server proof anchoring uses `@polkadot/api`, `@polkadot/keyring`, and
  `system.remark`.
- Browser wallet integration for the restored product shell still uses the
  existing wallet runtime until a full Portaldot wallet UI replaces those
  payment controls.

## Core Contracts

- Open-source ink! contracts live in `contracts/portal_kubo_*`.
- `portal_kubo_proof` stores proof records by run ID and emits `ProofAnchored`.
- `portal_kubo_budget_vault` handles native POT workflow budgets.
- `portal_kubo_payment_escrow` handles native POT API/workflow payment escrow.
- `portal_kubo_subscription_manager` handles native POT subscriptions.
- The current proof anchoring path uses `system.remark` so the demo can run on a
  local Portaldot node before deployed contract addresses are available.
- After deploying the ink! contracts, set the matching
  `NEXT_PUBLIC_PORTALDOT_*_ADDRESS` variables.

## Environment

Use `.env.example` as the template:

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_DESCRIPTION`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_PORTALDOT_WS_URL`
- `NEXT_PUBLIC_PORTALDOT_SS58_FORMAT`
- `NEXT_PUBLIC_PORTALDOT_TOKEN_SYMBOL`
- `NEXT_PUBLIC_PORTALDOT_TOKEN_DECIMALS`
- `NEXT_PUBLIC_PORTALDOT_PROOF_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_PORTALDOT_BUDGET_VAULT_ADDRESS`
- `NEXT_PUBLIC_PORTALDOT_PAYMENT_ESCROW_ADDRESS`
- `NEXT_PUBLIC_PORTALDOT_SUBSCRIPTION_MANAGER_ADDRESS`
- `PORTALDOT_AGENT_ATTESTER_URI`
- `DEMO_VIDEO_URL`
- `PITCH_DECK_URL`

## Structure

- `src/app` - Next.js App Router marketing, app, admin, and API routes.
- `src/components` - shared UI, layout, providers, billing, wallet, admin, and
  data display components.
- `src/features` - marketplace, agents, billing, proof, and product workflow
  logic.
- `src/lib` - Convex, environment, configuration, contract helpers, Portaldot
  helpers, and utility code.
- `convex` - current Convex schema and functions.
- `contracts/portal_kubo_*` - ink! contracts.
- `docs` - demo and deployment documentation.

## Development Commands

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

Build and deploy the ink! contracts with:

```bash
pnpm contracts:build
pnpm contracts:deploy
```
