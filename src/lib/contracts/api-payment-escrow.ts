import { blake2AsHex } from '@polkadot/util-crypto'

import { paymentTokenDecimals } from '@/lib/config/chains'

type EscrowableProduct = {
  executionMode: 'synchronous' | 'asynchronous'
  providerWallet?: string
  pricing: {
    model: 'fixed' | 'credit_metered'
  }
}

export type Hex = `0x${string}`
export type Address = string

export type EscrowWriteResult = {
  txHash: Hex
  explorerUrl: string | null
}

export type EscrowPaymentState = 'none' | 'reserved' | 'released' | 'refunded'

export type EscrowPaymentDetails = {
  token: Address
  payer: Address
  provider: Address
  amount: bigint
  settlementTxHash: Hex
  state: EscrowPaymentState
  reservedAt: bigint
  finalizedAt: bigint
}

export const apiPaymentEscrowAbi = []

export function shouldUseApiPaymentEscrow(_product: EscrowableProduct) {
  return false
}

export function getApiPaymentPayTo(product: EscrowableProduct) {
  return product.providerWallet ?? ''
}

export function getEscrowPaymentId(orderId: string, receiptId: string): Hex {
  return blake2AsHex(`${orderId}:${receiptId}`, 256) as Hex
}

export function toAtomicPaymentAmount(amountUsd: number) {
  const [wholePart = '0', fractionPart = ''] = amountUsd
    .toFixed(Math.min(paymentTokenDecimals, 6))
    .split('.')
  const fraction = fractionPart
    .padEnd(paymentTokenDecimals, '0')
    .slice(0, paymentTokenDecimals)
  return BigInt(`${wholePart}${fraction}`.replace(/^0+(?=\d)/, ''))
}

export async function reserveEscrowPayment(
  ..._args: unknown[]
): Promise<EscrowWriteResult> {
  return deferredWrite()
}

export async function releaseEscrowPayment(
  ..._args: unknown[]
): Promise<EscrowWriteResult> {
  return deferredWrite()
}

export async function refundEscrowPayment(
  ..._args: unknown[]
): Promise<EscrowWriteResult> {
  return deferredWrite()
}

export async function getEscrowPaymentState(
  ..._args: unknown[]
): Promise<EscrowPaymentState> {
  return 'none'
}

export async function getEscrowPaymentDetails(
  ..._args: unknown[]
): Promise<EscrowPaymentDetails | null> {
  return null
}

function deferredWrite(): EscrowWriteResult {
  return {
    txHash: `0x${'0'.repeat(64)}`,
    explorerUrl: null
  }
}
