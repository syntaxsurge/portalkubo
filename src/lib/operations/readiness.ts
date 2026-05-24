import { getPublishedProducts } from '@/features/marketplace/products'
import { listSettlementReceipts } from '@/features/marketplace/receipt-store'
import { paymentNetwork } from '@/lib/config/chains'
import { envClient } from '@/lib/env/env.client'
import { envServer } from '@/lib/env/env.server'

export type ReadinessState = 'ready' | 'attention'

export type ReadinessItem = {
  label: string
  value: string
  state: ReadinessState
  detail: string
}

export async function getOperationalReadiness() {
  const [products, settlementReceipts] = await Promise.all([
    getPublishedProducts(),
    listSettlementReceipts()
  ])
  const items: ReadinessItem[] = [
    {
      label: 'Payment network',
      value: paymentNetwork,
      state:
        paymentNetwork === 'local' || paymentNetwork.startsWith('portaldot')
          ? 'ready'
          : 'attention',
      detail: 'Paid API routes are configured for Portaldot native POT.'
    },
    {
      label: 'Wallet onboarding',
      value: 'Polkadot-compatible injected wallet',
      state: 'ready',
      detail:
        'SubWallet, Talisman, and Polkadot.js expose accounts through the injected wallet interface.'
    },
    {
      label: 'External HTTP adapter',
      value: 'Configured per listing',
      state: 'ready',
      detail:
        'Provider-created listings store upstream endpoint, auth, and polling mappings for paid forwarding.'
    },
    {
      label: 'Marketplace listings',
      value: products.length.toString(),
      state: products.length > 0 ? 'ready' : 'attention',
      detail: 'Published listings are available for paid buyer and agent calls.'
    },
    {
      label: 'Receipt records',
      value: settlementReceipts.length.toString(),
      state: settlementReceipts.length > 0 ? 'ready' : 'attention',
      detail: 'Receipt pages show POT amount, fee split, tx hash, and explorer.'
    },
    {
      label: 'Agent spender',
      value: envServer.PORTALDOT_AGENT_ATTESTER_URI
        ? 'Configured'
        : 'Local execution only',
      state: envServer.PORTALDOT_AGENT_ATTESTER_URI ? 'ready' : 'attention',
      detail:
        'Server-side agent runs use this Portaldot signer for proof anchoring.'
    },
    {
      label: 'Agent budget vault',
      value:
        envClient.NEXT_PUBLIC_AGENT_RUN_VAULT_ADDRESS ??
        'Contract not configured',
      state: envClient.NEXT_PUBLIC_AGENT_RUN_VAULT_ADDRESS
        ? 'ready'
        : 'attention',
      detail:
        'Production agent runs require a user-funded POT budget vault before spending.'
    },
    {
      label: 'Agent attestor',
      value: envServer.PORTALDOT_AGENT_ATTESTER_URI
        ? 'Configured'
        : 'Local execution only',
      state: envServer.PORTALDOT_AGENT_ATTESTER_URI ? 'ready' : 'attention',
      detail:
        'Completed agent runs anchor proof hashes with a Portaldot system.remark extrinsic.'
    },
    {
      label: 'Agent proof pages',
      value: '/proofs/[proofId]',
      state: 'ready',
      detail:
        'Public audit pages expose non-sensitive run summaries, receipts, and attestation links.'
    }
  ]

  return {
    items,
    readyCount: items.filter(item => item.state === 'ready').length,
    attentionCount: items.filter(item => item.state === 'attention').length
  }
}
