import { blake2AsHex } from '@polkadot/util-crypto'

import {
  defaultAppChain,
  getExplorerAddressUrl,
  paymentTokenAddress,
  paymentTokenDecimals
} from '@/lib/config/chains'
import { envClient } from '@/lib/env/env.client'

export type Hex = `0x${string}`
export type Address = string

export type AgentVaultWriteResult = {
  txHash: Hex
  explorerUrl: string | null
  attempts: AgentVaultWriteAttempt[]
}

export type AgentRunVaultFunctionName =
  | 'markRunning'
  | 'recordSpend'
  | 'recordSpendRefund'
  | 'markCompleted'
  | 'cancelRun'
  | 'refundUnused'

export type AgentVaultWriteAttempt = {
  attempt: number
  functionName: AgentRunVaultFunctionName
  status: 'failed' | 'succeeded'
  message: string
  gasLimit?: string
  txHash?: Hex | null
  explorerUrl?: string | null
  retryDelayMs?: number
  createdAt: string
}

export type AgentRunVaultBudget = {
  owner: Address
  agentSigner: Address
  token: Address
  fundedAmount: bigint
  spentAmount: bigint
  refundedAmount: bigint
  expiresAt: bigint
  state: number
  createdAt: bigint
  updatedAt: bigint
}

export const agentRunVaultAbi = []
export const erc20ApprovalAbi = []

export function getAgentRunVaultAddress() {
  return envClient.NEXT_PUBLIC_PORTALDOT_BUDGET_VAULT_ADDRESS || null
}

export function getAgentRunVaultExplorerUrl() {
  return getExplorerAddressUrl(getAgentRunVaultAddress(), defaultAppChain.id)
}

export function getAgentRunVaultOperatorPrivateKey() {
  return null
}

export function getAgentSignerAddress() {
  return null
}

export function getAgentRunBytes32(runId: string): Hex {
  return blake2AsHex(runId, 256) as Hex
}

export function getAgentVaultPaymentId(runId: string, actionId: string): Hex {
  return blake2AsHex(`${runId}:${actionId}`, 256) as Hex
}

export function parsePaymentAmountToAtomic(amount: number | string) {
  return decimalToAtomic(String(amount), paymentTokenDecimals)
}

export function formatAtomicPaymentAmount(amount: bigint) {
  return `${formatUnitsLocal(amount, paymentTokenDecimals)} POT`
}

export function getPaymentTokenAddress() {
  return paymentTokenAddress
}

export async function getAgentRunVaultBudget(
  _runId: string
): Promise<AgentRunVaultBudget | null> {
  return null
}

export function isActiveAgentRunVaultBudget(
  budget: AgentRunVaultBudget | null | undefined
) {
  return Boolean(budget && budget.state === 1)
}

export async function writeAgentRunVault({
  functionName
}: {
  functionName: AgentRunVaultFunctionName
  args: unknown[]
}): Promise<AgentVaultWriteResult> {
  return {
    txHash: `0x${'0'.repeat(64)}`,
    explorerUrl: null,
    attempts: [
      {
        attempt: 1,
        functionName,
        status: 'succeeded',
        message: 'Portaldot ink! vault write deferred until local deployment.',
        txHash: null,
        explorerUrl: null,
        createdAt: new Date().toISOString()
      }
    ]
  }
}

export function getAgentRunVaultWriteAttempts(error: unknown) {
  return [
    {
      attempt: 1,
      functionName: 'markRunning' as const,
      status: 'failed' as const,
      message: error instanceof Error ? error.message : String(error),
      createdAt: new Date().toISOString()
    }
  ]
}

function decimalToAtomic(value: string, decimals: number) {
  const [wholePart = '0', fractionPart = ''] = value.split('.')
  const fraction = fractionPart.padEnd(decimals, '0').slice(0, decimals)
  return BigInt(`${wholePart}${fraction}`.replace(/^0+(?=\d)/, ''))
}

function formatUnitsLocal(amount: bigint, decimals: number) {
  const divisor = 10n ** BigInt(decimals)
  const whole = amount / divisor
  const fraction = (amount % divisor).toString().padStart(decimals, '0')
  const trimmedFraction = fraction.replace(/0+$/, '')
  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole.toString()
}
