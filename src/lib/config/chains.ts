import { envClient } from '@/lib/env/env.client'
import { portaldotConfig } from '@/lib/portaldot/config'

export type SupportedChainKey = 'app'

export type AppChain = {
  key: SupportedChainKey
  id: string
  name: string
  shortName: string
  wsUrl: string
  ss58Format: number
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  explorer: {
    name: string
    baseUrl: string
  }
}

const appChainId = 'portaldot-local'
const appChainName = 'Portaldot Local'
const appChainShortName = 'Portaldot Local'
const appChainExplorerName = 'Portaldot Explorer'
const appChainExplorerUrl = 'https://portaldot.subscan.io'
const appChainNativeCurrency = {
  name: portaldotConfig.tokenSymbol,
  symbol: portaldotConfig.tokenSymbol,
  decimals: portaldotConfig.tokenDecimals
}

export const appChains = {
  app: {
    key: 'app',
    id: appChainId,
    name: appChainName,
    shortName: appChainShortName,
    nativeCurrency: appChainNativeCurrency,
    wsUrl: portaldotConfig.wsUrl,
    ss58Format: portaldotConfig.ss58Format,
    explorer: {
      name: appChainExplorerName,
      baseUrl: appChainExplorerUrl
    }
  }
} as const satisfies Record<SupportedChainKey, AppChain>

export const supportedAppChains = Object.values(appChains)
export const defaultAppChain = appChains.app
export const paymentNetwork = envClient.NEXT_PUBLIC_PORTALDOT_NETWORK ?? 'local'
const defaultPaymentTokenAddress =
  envClient.NEXT_PUBLIC_PORTALDOT_STABLECOIN_ADDRESS ?? ''
const defaultPaymentTokenDomainName = 'POT'
export const paymentTokenAddress =
  envClient.NEXT_PUBLIC_PAYMENT_TOKEN_ADDRESS ?? defaultPaymentTokenAddress
export const paymentTokenName =
  envClient.NEXT_PUBLIC_PAYMENT_TOKEN_NAME ?? defaultPaymentTokenDomainName
export const paymentTokenSymbol =
  envClient.NEXT_PUBLIC_PAYMENT_TOKEN_SYMBOL ?? 'POT'
export const paymentTokenLabel =
  envClient.NEXT_PUBLIC_PAYMENT_TOKEN_LABEL ?? paymentTokenSymbol
export const paymentTokenVersion =
  envClient.NEXT_PUBLIC_PAYMENT_TOKEN_VERSION ?? '1'
export const paymentTokenDecimals =
  envClient.NEXT_PUBLIC_PAYMENT_TOKEN_DECIMALS ?? 14
export const paymentTokenTransferMethod =
  envClient.NEXT_PUBLIC_PAYMENT_TOKEN_TRANSFER_METHOD ?? 'native'

export function toPaymentAssetAmount(amountUsd: number) {
  const amount = decimalToPlanck(
    amountUsd.toFixed(Math.min(paymentTokenDecimals, 6)),
    paymentTokenDecimals
  )

  return {
    amount: amount.toString(),
    asset: paymentTokenAddress,
    extra: {
      name: paymentTokenName,
      symbol: paymentTokenSymbol,
      version: paymentTokenVersion,
      decimals: paymentTokenDecimals,
      assetTransferMethod: paymentTokenTransferMethod
    }
  }
}

export function getAppChainById(chainId?: string | number | null) {
  return (
    supportedAppChains.find(chain => chain.id === String(chainId)) ??
    defaultAppChain
  )
}

export function getSubscriptionChain() {
  return getAppChainById(envClient.NEXT_PUBLIC_SUBSCRIPTION_CHAIN_ID)
}

export function getExplorerAddressUrl(
  address: string | null | undefined,
  chainId: string | number = getSubscriptionChain().id
) {
  if (!address) {
    return null
  }

  return `${getAppChainById(chainId).explorer.baseUrl}/address/${address}`
}

export function getExplorerTransactionUrl(
  hash: string | null | undefined,
  chainId: string | number = getSubscriptionChain().id
) {
  if (!hash) {
    return null
  }

  return `${getAppChainById(chainId).explorer.baseUrl}/tx/${hash}`
}

function decimalToPlanck(value: string, decimals: number) {
  const [wholePart = '0', fractionPart = ''] = value.split('.')
  const paddedFraction = fractionPart.padEnd(decimals, '0').slice(0, decimals)
  return BigInt(`${wholePart}${paddedFraction}`.replace(/^0+(?=\d)/, ''))
}
