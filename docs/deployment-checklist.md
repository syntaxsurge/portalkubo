# Deployment Checklist

Use this checklist before operating the PortalKubo demo.

## Required Environment

- `NEXT_PUBLIC_APP_NAME=PortalKubo`
- `NEXT_PUBLIC_APP_DESCRIPTION=AI agents that pay, call, and prove on Portaldot.`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_ADMIN_WALLET_ADDRESSES`
- `NEXT_PUBLIC_PORTALDOT_WS_URL=ws://127.0.0.1:9944`
- `NEXT_PUBLIC_PORTALDOT_SS58_FORMAT=42`
- `NEXT_PUBLIC_PORTALDOT_TOKEN_SYMBOL=POT`
- `NEXT_PUBLIC_PORTALDOT_TOKEN_DECIMALS=14`
- `NEXT_PUBLIC_PORTALDOT_PROOF_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_PORTALDOT_BUDGET_VAULT_ADDRESS`
- `NEXT_PUBLIC_PORTALDOT_PAYMENT_ESCROW_ADDRESS`
- `NEXT_PUBLIC_PORTALDOT_SUBSCRIPTION_MANAGER_ADDRESS`
- `PORTALDOT_AGENT_ATTESTER_URI`
- `NEXT_PUBLIC_PAYMENT_TOKEN_NAME=POT`
- `NEXT_PUBLIC_PAYMENT_TOKEN_SYMBOL=POT`
- `NEXT_PUBLIC_PAYMENT_TOKEN_LABEL=POT`
- `NEXT_PUBLIC_PAYMENT_TOKEN_VERSION=1`
- `NEXT_PUBLIC_PAYMENT_TOKEN_DECIMALS=14`
- `NEXT_PUBLIC_PAYMENT_TOKEN_TRANSFER_METHOD=native`
- `AGENT_LLM_API_KEY`
- `AGENT_LLM_MODEL=gpt-5.2`

## Contract Commands

```bash
pnpm contracts:build
pnpm contracts:deploy
```

The deployment script expects a running local Portaldot node at
`NEXT_PUBLIC_PORTALDOT_WS_URL`. After deployment, copy each ink! contract
address into the matching `NEXT_PUBLIC_PORTALDOT_*_ADDRESS` variable.

## Verification Commands

```bash
pnpm install
pnpm typecheck
pnpm build
```

## Runtime Checks

- `GET /api/health` returns readiness checks.
- `GET /api/openapi.json` returns the OpenAPI document.
- `GET /api/reference` renders the Scalar reference.
- `pnpm seed:database` upserts wallet-scoped users and provider profiles.
- `pnpm seed:admin-tools` upserts public provider-owned marketplace tools.
- `POST /api/agents/runs` creates an autonomous agent run.
- `POST /api/agents/runs/[runId]/execute` runs OpenAI planning and synthesis
  when `AGENT_LLM_API_KEY` is configured, otherwise uses deterministic fallback.
- `POST /api/agents/runs/[runId]/attest` anchors the proof with a Portaldot
  `system.remark` extrinsic.
- `GET /api/proofs/[proofId]` returns the public proof package.
- `/marketplace` shows published API products.
- `/agents` and `/agents/new` show the autonomous agent lifecycle.
- `/proofs/[proofId]` renders without wallet auth.
- `/provider` shows the connected wallet's owned listings, POT revenue, recent
  request activity, agent-created calls, and fee split.
- `/admin/products`, `/admin/orders`, `/admin/agents`, and `/admin/receipts`
  show global server-side tables for ownership, usage, autonomous runs, and
  settlement reconciliation.
- `/billing` shows POT receipts, managed credit balance, API key creation, and
  top-up/debit history.
- `/admin/operations` shows payment, adapter, wallet, and receipt readiness.
