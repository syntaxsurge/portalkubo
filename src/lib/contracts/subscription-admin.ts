import 'server-only'

import {
  getExplorerAddressUrl,
  getSubscriptionChain
} from '@/lib/config/chains'
import {
  formatNativeAmount,
  getSubscriptionManagerAddress
} from '@/lib/contracts/subscription'

export type AdminSubscriptionQuery = {
  page?: string
  pageSize?: string
}

export type AdminSubscriptionRecord = {
  walletAddress: string
  planKey: number
  planName: string
  paidUntil: string | null
  active: boolean
  autoRenew: boolean
  canceledAt: string | null
  walletExplorerUrl: string
}

export type AdminSubscriptionSnapshot = {
  contractAddress: string | null
  contractExplorerUrl: string | null
  contractConfigured: boolean
  chainId: string
  chainName: string
  explorerName: string
  nativeTokenSymbol: string
  contractBalanceWei: bigint
  contractBalanceLabel: string
  basePriceWei: bigint | null
  plusPriceWei: bigint | null
  basePriceLabel: string
  plusPriceLabel: string
  subscriberCount: number
  subscribers: AdminSubscriptionRecord[]
  page: number
  pageSize: number
  pageCount: number
  supportsSubscriberRegistry: boolean
  supportsTreasuryWithdraw: boolean
  readError: string | null
}

const subscriptionChain = getSubscriptionChain()
const defaultPageSize = 10

export async function getAdminSubscriptionSnapshot(
  query: AdminSubscriptionQuery
): Promise<AdminSubscriptionSnapshot> {
  const contractAddress = getSubscriptionManagerAddress() ?? null
  const pageSize = Math.min(
    clampPositiveInt(query.pageSize, defaultPageSize),
    50
  )

  return {
    contractAddress,
    contractExplorerUrl: getExplorerAddressUrl(contractAddress),
    contractConfigured: Boolean(contractAddress),
    chainId: subscriptionChain.id,
    chainName: subscriptionChain.shortName,
    explorerName: subscriptionChain.explorer.name,
    nativeTokenSymbol: subscriptionChain.nativeCurrency.symbol,
    contractBalanceWei: 0n,
    contractBalanceLabel: formatNativeAmount(0n),
    basePriceWei: null,
    plusPriceWei: null,
    basePriceLabel: 'Deploy ink! contract',
    plusPriceLabel: 'Deploy ink! contract',
    subscriberCount: 0,
    subscribers: [],
    page: 1,
    pageSize,
    pageCount: 1,
    supportsSubscriberRegistry: false,
    supportsTreasuryWithdraw: false,
    readError: contractAddress
      ? 'Portaldot subscription admin reads are available after the ink! contract is deployed and indexed.'
      : 'Configure NEXT_PUBLIC_PORTALDOT_SUBSCRIPTION_MANAGER_ADDRESS first.'
  }
}

export function formatNativePriceInput(value: bigint | null) {
  if (value === null) {
    return ''
  }

  const divisor = 10n ** BigInt(subscriptionChain.nativeCurrency.decimals)
  const whole = value / divisor
  const fraction = (value % divisor)
    .toString()
    .padStart(subscriptionChain.nativeCurrency.decimals, '0')
    .replace(/0+$/, '')

  return fraction ? `${whole}.${fraction}` : whole.toString()
}

function clampPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback
  }

  return parsed
}
