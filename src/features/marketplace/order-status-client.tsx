'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileJson,
  Loader2,
  ReceiptText,
  RefreshCw,
  WalletCards
} from 'lucide-react'

import { JsonViewer } from '@/components/data-display/json-viewer'
import { Badge } from '@/components/ui/badge'
import { Button, buttonClasses } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { WalletAddressConsumer } from '@/components/wallet/wallet-address-consumer'
import { CopyTextButton } from '@/features/marketplace/copy-endpoint-button'
import {
  orderStatusDetails,
  orderStatusLabels
} from '@/features/marketplace/status'
import type { MarketplaceOrder } from '@/features/marketplace/types'
import { useAutoPolling } from '@/hooks/use-auto-polling'
import { paymentTokenSymbol } from '@/lib/config/chains'

type OrderStatusClientProps = {
  orderId: string
  initialOrder: MarketplaceOrder | null
}

export function OrderStatusClient({
  orderId,
  initialOrder
}: OrderStatusClientProps) {
  const [order, setOrder] = useState<MarketplaceOrder | null>(initialOrder)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [isCalling, setIsCalling] = useState(false)

  async function refreshOrder() {
    const response = await fetch(`/api/orders/${orderId}`, {
      cache: 'no-store'
    })
    const body = (await response.json().catch(() => null)) as {
      order?: MarketplaceOrder | null
      error?: string
    } | null

    if (!response.ok) {
      throw new Error(body?.error ?? 'Unable to refresh order.')
    }

    setOrder(body?.order ?? null)
  }

  useAutoPolling({
    enabled: Boolean(order && ['pending', 'processing'].includes(order.status)),
    intervalMs: 8000,
    onPoll: refreshOrder
  })

  useEffect(() => {
    if (!order && initialOrder) {
      setOrder(initialOrder)
    }
  }, [initialOrder, order])

  async function runNativeCall(walletAddress: string | null) {
    if (!order) {
      return
    }

    if (!walletAddress) {
      setError('Connect a Portaldot wallet before running this order.')
      return
    }

    setIsCalling(true)
    setStatus('Submitting the Portaldot-native paid API request.')
    setError('')

    try {
      const response = await fetch(
        `/api/credits/products/${order.productSlug}/call`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: order.requestPayloadJson ?? '{}'
        }
      )
      const body = (await response.json().catch(() => null)) as {
        order?: MarketplaceOrder
        error?: string
      } | null

      if (!response.ok) {
        throw new Error(body?.error ?? 'The Portaldot paid call failed.')
      }

      setOrder(body?.order ?? order)
      setStatus(
        'The provider request completed through the Portaldot payment path.'
      )
    } catch (runError) {
      setError(
        runError instanceof Error
          ? runError.message
          : 'The Portaldot paid call failed.'
      )
    } finally {
      setIsCalling(false)
    }
  }

  if (!order) {
    return (
      <Card className='p-6'>
        <div className='flex items-start gap-3'>
          <AlertTriangle className='text-warning mt-1 h-5 w-5' />
          <div>
            <h1 className='text-xl font-semibold'>Order not found</h1>
            <p className='text-muted-foreground mt-2 text-sm'>
              This order is not available in the current Convex workspace.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  const statusCopy = orderStatusDetails[order.status]

  return (
    <WalletAddressConsumer>
      {wallet => (
        <div className='space-y-6'>
          <Card className='p-6'>
            <div className='flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between'>
              <div>
                <div className='mb-3 flex flex-wrap items-center gap-2'>
                  <Badge>{orderStatusLabels[order.status]}</Badge>
                  <Badge>Portaldot native</Badge>
                  <Badge>{paymentTokenSymbol}</Badge>
                </div>
                <h1 className='text-2xl font-semibold tracking-tight'>
                  {order.productName}
                </h1>
                <p className='text-muted-foreground mt-2 max-w-2xl text-sm'>
                  {statusCopy}
                </p>
              </div>

              <div className='flex flex-wrap gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => void refreshOrder()}
                >
                  <RefreshCw className='h-4 w-4' />
                  Refresh
                </Button>
                <Button
                  type='button'
                  onClick={() => void runNativeCall(wallet.address)}
                  disabled={isCalling || order.status === 'completed'}
                >
                  {isCalling ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <WalletCards className='h-4 w-4' />
                  )}
                  Run with wallet
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

          <div className='grid gap-4 md:grid-cols-3'>
            <MetricCard label='Amount' value={`${order.amountUsdc} POT`} />
            <MetricCard label='Provider' value={order.providerName} />
            <MetricCard label='Request' value={order.requestId} />
          </div>

          <Card className='p-6'>
            <div className='mb-4 flex items-center justify-between gap-3'>
              <div>
                <h2 className='flex items-center gap-2 text-lg font-semibold'>
                  <ReceiptText className='h-5 w-5' />
                  Order details
                </h2>
                <p className='text-muted-foreground mt-1 text-sm'>
                  Stored order state from the current Convex database.
                </p>
              </div>
              {order.explorerUrl ? (
                <Link
                  href={order.explorerUrl}
                  target='_blank'
                  className={buttonClasses({ variant: 'outline', size: 'md' })}
                >
                  <ExternalLink className='h-4 w-4' />
                  Explorer
                </Link>
              ) : null}
            </div>
            <JsonViewer value={order} title='Order JSON' />
          </Card>

          <Card className='p-6'>
            <div className='mb-4 flex items-center justify-between gap-3'>
              <div>
                <h2 className='flex items-center gap-2 text-lg font-semibold'>
                  <FileJson className='h-5 w-5' />
                  Native endpoint
                </h2>
                <p className='text-muted-foreground mt-1 text-sm'>
                  This demo calls the PortalKubo Portaldot payment gateway
                  endpoint.
                </p>
              </div>
              <CopyTextButton
                text={`/api/credits/products/${order.productSlug}/call`}
                label='Copy endpoint'
              />
            </div>
            <code className='bg-muted block overflow-auto rounded-md p-3 text-sm'>
              /api/credits/products/{order.productSlug}/call
            </code>
          </Card>
        </div>
      )}
    </WalletAddressConsumer>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className='p-5'>
      <p className='text-muted-foreground flex items-center gap-2 text-sm'>
        <Clock3 className='h-4 w-4' />
        {label}
      </p>
      <p className='mt-2 truncate text-lg font-semibold'>{value}</p>
    </Card>
  )
}
