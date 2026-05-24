# PortalKubo

POT-native API commerce for humans, applications, and AI agents on Portaldot.

PortalKubo is a paid API marketplace and gateway. Providers list paid endpoints,
buyers and agents pay per request using the configured payment token, and
PortalKubo handles discovery, Portaldot payment flow, request forwarding,
receipts, usage records, and provider dashboards.

## Highlights

- Next.js 15 + React 19 App Router setup.
- Portaldot-native proof anchoring with POT gas and ink! contract sources.
- Polkadot extension-compatible wallet onboarding.
- Marketplace catalog with POT prices, provider badges, Portaldot payment flags,
  and agent-ready API details.
- Autonomous Launch Pack Agent runs with an OpenAI planner and synthesizer that
  choose paid tools, buy selected APIs, return deliverables, and publish
  on-chain proof pages. A deterministic planner is available when no OpenAI key
  is set.
- Provider dashboard with API call, revenue, success-rate, and fee-split
  metrics.
- Provider product management for listing APIs, validating schemas, reviewing
  product status, copying gateway endpoints, and testing paid request setup.
- Buyer order lifecycle pages for payment-required, processing, completed,
  failed, and expired API requests, with browser wallet Portaldot payment
  checkout, POT settlement, provider results, and receipt links.
- Managed credits for teams that prefer API-key usage after recording POT
  top-ups.
- Portaldot payment-protected product call route for settlement through the
  configured facilitator.
- Public proof pages for autonomous runs with receipt rollups, proof hashes, and
  explorer links.
- Generic external HTTP adapter for provider-created APIs, including private
  upstream auth, async job polling, and result-path extraction behind the same
  paid gateway contract.
- OpenAPI import for faster provider onboarding from hosted JSON/YAML specs or
  uploaded files.
- OpenAPI JSON and Scalar API reference for gateway, receipt, provider, and
  agent routes.
- Receipt pages with POT amount, fee split, payer, provider wallet, transaction
  hash, and explorer links.
- Admin moderation pages for API products and buyer request operations.
- Convex schema for providers, API products, versions, orders, receipts,
  requests, usage events, webhooks, payouts, examples, and reviews.
- Admin panel and wallet-protected app routes.
- Light/dark mode using `next-themes`.

## Getting Started

```bash
pnpm install
pnpm dev
```

## Convex

```bash
pnpm convex:dev
pnpm convex:deploy
pnpm seed:database
pnpm seed:admin-tools
```

`seed:database` upserts wallet-scoped users with associated provider profiles.
`seed:admin-tools` upserts the public provider-owned marketplace tools. Both
commands use the configured `NEXT_PUBLIC_CONVEX_URL`.

## Portaldot Chain

PortalKubo defaults to a local Portaldot node for POT-paid API commerce and
proof anchoring. Start the node, build the ink! contracts, deploy them, then set
the `NEXT_PUBLIC_PORTALDOT_*_ADDRESS` values.

- Local WebSocket RPC: `ws://127.0.0.1:9944`
- SS58 format: `42`
- Native gas currency: `POT`
- Token decimals: `14`
- Wallet extension: Polkadot.js-compatible browser extension
- Official docs: `https://portaldot-dev.readthedocs.io/en/latest/`

### Core ink! Contracts

- `contracts/portal_kubo_proof`
- `contracts/portal_kubo_budget_vault`
- `contracts/portal_kubo_payment_escrow`
- `contracts/portal_kubo_subscription_manager`

```bash
pnpm contracts:build
pnpm contracts:deploy
```

`contracts:build` uses the installed Rust `1.89.0` toolchain because the current
`cargo-contract` binary and these ink! 4.3 contracts do not build against the
active stable 1.92 toolchain.

## Paid API Calls

Raw `curl` requests intentionally return `402 Payment Required` because the
server is advertising the POT payment requirements. External developers do not
need to clone this repository to use PortalKubo APIs; they install the Portaldot
payment buyer SDK in their own backend, CLI, or agent and call the hosted
PortalKubo product endpoint.

After publishing a provider product, configure the agent signer and run the
hosted product slug:

```bash
pnpm native-payment:call media-launch-job-api
```

The command uses `@Portaldot payment/fetch` to sign the payment, retry the
request, and print the settled response.

Humans can also open a marketplace product, create a payable request, and click
`Run with wallet` to check POT readiness, sign the Portaldot payment from the
connected browser wallet, and receive the provider response. Teams that want
API-key ergonomics can use `/billing` to create a managed credit account and
call `/api/credits/products/{slug}/call` with a PortalKubo API key.

Providers can open `/provider/products/new` and import an OpenAPI JSON/YAML URL
or file to prefill endpoint URL, method, auth type, schemas, sample payload,
async polling, and result-path fields before publishing a paid listing.

## Walkthrough And Deployment

- Deployment checklist:
  [docs/deployment-checklist.md](docs/deployment-checklist.md)
- Walkthrough script: [docs/demo-script.md](docs/demo-script.md)
- API reference: `/api/reference`
- OpenAPI JSON: `/api/openapi.json`
- Operations health: `/api/health`

Deploy manually with the Vercel CLI:

```bash
pnpm add -D vercel@latest
pnpm exec vercel login
pnpm exec vercel --prod
```

Run `pnpm exec vercel login` only when the CLI is not authenticated. The current
Vercel CLI login flow uses browser-based OAuth device authorization; do not pass
an email address or deprecated provider flags to the login command. If using the
global `vercel` command directly, update it with `npm i -g vercel@latest`.

Manage Vercel project environment variables with the CLI:

```bash
pnpm exec vercel env ls
pnpm exec vercel env add NEXT_PUBLIC_CONVEX_URL production --force
pnpm exec vercel env add AGENT_LLM_API_KEY production --force
pnpm exec vercel env pull .env.local
pnpm exec vercel --prod
```

Use `vercel env add <name> production --force` to create or update a production
variable. Redeploy with `pnpm exec vercel --prod` after environment changes so
the new values are available to the build and runtime.

To replace Vercel production environment variables with the values currently in
`.env.local`, upsert the local keys with `vercel env add --force`, then
redeploy:

```bash
pnpm vercel:env:sync:production
```

Use `pnpm vercel:env:sync:preview` or `pnpm vercel:env:sync:development` to
reset those Vercel environments without a production redeploy. The sync script
requires an existing Vercel project link and never pulls Vercel env values into
`.env.local`. If the project is not linked yet, run `pnpm exec vercel link`
first and do not pull environment variables when prompted. The sync script
creates or replaces keys present in `.env.local`; remove extra Vercel-only keys
manually with `pnpm exec vercel env rm <KEY> production --yes`.

## Environment

Copy `.env.example` to `.env.local` and configure the values for your local
deployment.

Key values:

- `NEXT_PUBLIC_PORTALDOT_WS_URL=ws://127.0.0.1:9944`
- `NEXT_PUBLIC_PORTALDOT_SS58_FORMAT=42`
- `NEXT_PUBLIC_PORTALDOT_TOKEN_SYMBOL=POT`
- `NEXT_PUBLIC_PORTALDOT_TOKEN_DECIMALS=14`
- `NEXT_PUBLIC_PORTALDOT_PROOF_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_PORTALDOT_BUDGET_VAULT_ADDRESS`
- `NEXT_PUBLIC_PORTALDOT_PAYMENT_ESCROW_ADDRESS`
- `NEXT_PUBLIC_PORTALDOT_SUBSCRIPTION_MANAGER_ADDRESS`
- `PORTALDOT_AGENT_ATTESTER_URI=//Alice`
- `NEXT_PUBLIC_PAYMENT_TOKEN_NAME`
- `NEXT_PUBLIC_PAYMENT_TOKEN_SYMBOL`
- `NEXT_PUBLIC_PAYMENT_TOKEN_LABEL`
- `NEXT_PUBLIC_PAYMENT_TOKEN_VERSION`
- `NEXT_PUBLIC_PAYMENT_TOKEN_DECIMALS`
- `NEXT_PUBLIC_PAYMENT_TOKEN_TRANSFER_METHOD=native`
- `AGENT_LLM_API_KEY`
- `AGENT_LLM_MODEL=gpt-5.2`

## Autonomous Agent Walkthrough

1. Open `/agents/new`.
2. Enter a launch-pack goal, budget cap, and allowed tools. The owner is the
   connected wallet and is not typed manually.
3. Start the run, open `/agents/[runId]`, and execute paid actions.
4. Attest the completed run and open `/proofs/[proofId]`.
5. For OpenAI-planned agent runs, set `AGENT_LLM_API_KEY` and optionally
   `AGENT_LLM_MODEL`; otherwise the run is labeled as deterministic fallback.
6. For proof anchoring, run a local Portaldot node, set
   `PORTALDOT_AGENT_ATTESTER_URI`, and attest the completed run. The app writes
   a Portaldot `system.remark` extrinsic that pays gas in POT and links the
   proof page to the resulting extrinsic hash.

## Core Commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
pnpm convex:dev
pnpm convex:deploy
pnpm contracts:build
pnpm contracts:deploy
```
