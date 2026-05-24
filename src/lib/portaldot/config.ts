import { envClient } from '@/lib/env/env.client'

export const portaldotConfig = {
  wsUrl: envClient.NEXT_PUBLIC_PORTALDOT_WS_URL ?? 'ws://127.0.0.1:9944',
  ss58Format: envClient.NEXT_PUBLIC_PORTALDOT_SS58_FORMAT ?? 42,
  tokenSymbol: envClient.NEXT_PUBLIC_PORTALDOT_TOKEN_SYMBOL ?? 'POT',
  tokenDecimals: envClient.NEXT_PUBLIC_PORTALDOT_TOKEN_DECIMALS ?? 14,
  network: envClient.NEXT_PUBLIC_PORTALDOT_NETWORK ?? 'local',
  contracts: {
    proof: envClient.NEXT_PUBLIC_PORTALDOT_PROOF_CONTRACT_ADDRESS ?? '',
    budgetVault: envClient.NEXT_PUBLIC_PORTALDOT_BUDGET_VAULT_ADDRESS ?? '',
    paymentEscrow: envClient.NEXT_PUBLIC_PORTALDOT_PAYMENT_ESCROW_ADDRESS ?? '',
    stablecoin: envClient.NEXT_PUBLIC_PORTALDOT_STABLECOIN_ADDRESS ?? '',
    subscriptionManager:
      envClient.NEXT_PUBLIC_PORTALDOT_SUBSCRIPTION_MANAGER_ADDRESS ?? ''
  }
} as const

export function getPortaldotExplorerExtrinsicUrl(hash: string | null) {
  if (!hash) {
    return null
  }

  return `https://portaldot.subscan.io/extrinsic/${hash}`
}
