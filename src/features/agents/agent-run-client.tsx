'use client'

import Link from 'next/link'
import { useState } from 'react'

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
  WalletCards
} from 'lucide-react'

import { JsonViewer } from '@/components/data-display/json-viewer'
import { MarkdownViewer } from '@/components/data-display/markdown-viewer'
import { Button, buttonClasses } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { WalletAddressConsumer } from '@/components/wallet/wallet-address-consumer'
import {
  agentActionStatusLabels,
  agentRunStatusDetails,
  agentRunStatusLabels
} from '@/features/agents/status'
import type { AgentRun } from '@/features/agents/types'
import { useAutoPolling } from '@/hooks/use-auto-polling'

type AgentRunClientProps = {
  runId: string
  initialRun: AgentRun | null
}

const pollingStatuses = new Set<AgentRun['status']>(['running', 'attesting'])

export function AgentRunClient({ runId, initialRun }: AgentRunClientProps) {
  const [run, setRun] = useState<AgentRun | null>(initialRun)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)

  async function refreshRun() {
    const response = await fetch(`/api/agents/runs/${runId}`, {
      cache: 'no-store'
    })
    const body = (await response.json().catch(() => null)) as {
      run?: AgentRun | null
      error?: string
    } | null

    if (!response.ok) {
      throw new Error(body?.error ?? 'Unable to refresh the agent run.')
    }

    setRun(body?.run ?? null)
  }

  useAutoPolling({
    enabled: Boolean(run && pollingStatuses.has(run.status)),
    intervalMs: 8000,
    onPoll: refreshRun
  })

  async function executeRun(walletAddress: string | null) {
    if (!walletAddress) {
      setError('Connect a Portaldot wallet before executing this agent run.')
      return
    }

    setIsExecuting(true)
    setStatus('Executing the AI workflow and preparing Portaldot proof data.')
    setError('')

    try {
      const response = await fetch(`/api/agents/runs/${runId}/execute`, {
        method: 'POST'
      })
      const body = (await response.json().catch(() => null)) as {
        run?: AgentRun
        error?: string
      } | null

      if (!response.ok) {
        throw new Error(body?.error ?? 'Unable to execute the agent run.')
      }

      setRun(body?.run ?? run)
      setStatus(
        'The AI workflow completed. Anchor the proof hash on Portaldot.'
      )
    } catch (executeError) {
      setError(
        executeError instanceof Error
          ? executeError.message
          : 'Unable to execute the agent run.'
      )
    } finally {
      setIsExecuting(false)
    }
  }

  if (!run) {
    return (
      <Card className='p-6'>
        <div className='flex items-start gap-3'>
          <AlertTriangle className='text-warning mt-1 h-5 w-5' />
          <div>
            <h1 className='text-xl font-semibold'>Agent run not found</h1>
            <p className='text-muted-foreground mt-2 text-sm'>
              This run is not available in the current Convex workspace.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  const statusCopy = agentRunStatusDetails[run.status]

  return (
    <WalletAddressConsumer>
      {wallet => (
        <div className='space-y-6'>
          <Card className='p-6'>
            <div className='flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between'>
              <div>
                <div className='mb-3 flex flex-wrap items-center gap-2'>
                  <span className='bg-accent text-accent-foreground rounded-md px-2.5 py-1 text-xs font-semibold'>
                    {agentRunStatusLabels[run.status]}
                  </span>
                  <span className='border-border text-muted-foreground rounded-md border px-2.5 py-1 text-xs font-semibold'>
                    Portaldot native
                  </span>
                </div>
                <h1 className='text-2xl font-semibold tracking-tight'>
                  {run.title}
                </h1>
                <p className='text-muted-foreground mt-2 max-w-2xl text-sm'>
                  {statusCopy}
                </p>
              </div>

              <div className='flex flex-wrap gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => void refreshRun()}
                >
                  <RefreshCw className='h-4 w-4' />
                  Refresh
                </Button>
                <Button
                  type='button'
                  onClick={() => void executeRun(wallet.address)}
                  disabled={isExecuting || run.status === 'completed'}
                >
                  {isExecuting ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Play className='h-4 w-4' />
                  )}
                  Execute
                </Button>
              </div>
            </div>

            {status ? (
              <p className='text-success mt-5 flex items-center gap-2 text-sm'>
                <CheckCircle2 className='h-4 w-4' />
                {status}
              </p>
            ) : null}
            {error ? (
              <p className='text-destructive mt-5 flex items-center gap-2 text-sm'>
                <AlertTriangle className='h-4 w-4' />
                {error}
              </p>
            ) : null}
          </Card>

          <div className='grid gap-4 md:grid-cols-4'>
            <Metric label='Budget' value={`${run.budgetCapUsdc} POT`} />
            <Metric label='Spent' value={`${run.spentAmountUsdc} POT`} />
            <Metric label='Actions' value={String(run.actions.length)} />
            <Metric label='Proof' value={run.proof ? 'Anchored' : 'Pending'} />
          </div>

          <Card className='p-6'>
            <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold'>
              <Bot className='h-5 w-5' />
              Actions
            </h2>
            <div className='space-y-3'>
              {run.actions.map(action => (
                <div
                  key={action.id}
                  className='border-border bg-card rounded-lg border p-4'
                >
                  <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
                    <div>
                      <p className='font-medium'>{action.productName}</p>
                      <p className='text-muted-foreground mt-1 text-sm'>
                        {action.objective}
                      </p>
                    </div>
                    <span className='bg-muted rounded-md px-2.5 py-1 text-xs font-semibold'>
                      {agentActionStatusLabels[action.status]}
                    </span>
                  </div>
                  {action.errorMessage ? (
                    <p className='text-destructive mt-3 text-sm'>
                      {action.errorMessage}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>

          {run.deliverables.launchBrief ? (
            <Card className='p-6'>
              <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold'>
                <FileCheck2 className='h-5 w-5' />
                Launch brief
              </h2>
              <MarkdownViewer value={run.deliverables.launchBrief} />
            </Card>
          ) : null}

          {run.proof ? (
            <Card className='p-6'>
              <div className='mb-4 flex items-center justify-between gap-3'>
                <div>
                  <h2 className='flex items-center gap-2 text-lg font-semibold'>
                    <ShieldCheck className='h-5 w-5' />
                    Portaldot proof
                  </h2>
                  <p className='text-muted-foreground mt-1 text-sm'>
                    Proof hash and extrinsic data for the demo.
                  </p>
                </div>
                {run.proof.explorerUrl ? (
                  <Link
                    href={run.proof.explorerUrl}
                    target='_blank'
                    className={buttonClasses({
                      variant: 'outline',
                      size: 'md'
                    })}
                  >
                    <ExternalLink className='h-4 w-4' />
                    Explorer
                  </Link>
                ) : null}
              </div>
              <JsonViewer value={run.proof} title='Proof JSON' />
            </Card>
          ) : null}

          <Card className='p-6'>
            <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold'>
              <WalletCards className='h-5 w-5' />
              Run JSON
            </h2>
            <JsonViewer value={run} title='Agent run JSON' />
          </Card>
        </div>
      )}
    </WalletAddressConsumer>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className='p-5'>
      <p className='text-muted-foreground text-sm'>{label}</p>
      <p className='mt-2 truncate text-lg font-semibold'>{value}</p>
    </Card>
  )
}
