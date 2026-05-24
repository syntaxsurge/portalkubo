'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { WalletAddressConsumer } from '@/components/wallet/wallet-address-consumer'
import { subscriptionNativeTokenSymbol } from '@/lib/contracts/subscription'

type AdminSubscriptionActionsProps = {
  contractAddress: string | null
  basePriceNative: string
  plusPriceNative: string
  supportsTreasuryWithdraw: boolean
}

export function AdminSubscriptionActions({
  contractAddress,
  basePriceNative,
  plusPriceNative,
  supportsTreasuryWithdraw
}: AdminSubscriptionActionsProps) {
  return (
    <WalletAddressConsumer>
      {({ address }) => (
        <AdminSubscriptionActionForms
          address={address}
          contractAddress={contractAddress}
          basePriceNative={basePriceNative}
          plusPriceNative={plusPriceNative}
          supportsTreasuryWithdraw={supportsTreasuryWithdraw}
        />
      )}
    </WalletAddressConsumer>
  )
}

function AdminSubscriptionActionForms({
  address,
  contractAddress,
  basePriceNative,
  plusPriceNative,
  supportsTreasuryWithdraw
}: AdminSubscriptionActionsProps & { address: string | null }) {
  const [base, setBase] = React.useState(basePriceNative)
  const [plus, setPlus] = React.useState(plusPriceNative)
  const [recipient, setRecipient] = React.useState(address ?? '')
  const [withdrawAmount, setWithdrawAmount] = React.useState('')
  const [status, setStatus] = React.useState('')

  React.useEffect(() => {
    setBase(basePriceNative)
  }, [basePriceNative])

  React.useEffect(() => {
    setPlus(plusPriceNative)
  }, [plusPriceNative])

  React.useEffect(() => {
    if (address && !recipient) {
      setRecipient(address)
    }
  }, [address, recipient])

  function explainPendingNativeDeployment(event: React.FormEvent) {
    event.preventDefault()
    setStatus(
      contractAddress
        ? 'Admin actions are routed through the Portaldot ink! subscription manager after deployment.'
        : 'Deploy the Portaldot ink! subscription manager before submitting admin contract actions.'
    )
  }

  return (
    <Card className='space-y-6 p-6'>
      <div>
        <h2 className='text-lg font-semibold'>Subscription contract admin</h2>
        <p className='text-muted-foreground mt-2 text-sm'>
          Connected admin wallet: {address ?? 'not connected'}
        </p>
      </div>

      <form
        className='grid gap-4 md:grid-cols-2'
        onSubmit={explainPendingNativeDeployment}
      >
        <label className='space-y-2'>
          <span className='text-sm font-medium'>
            Base price ({subscriptionNativeTokenSymbol})
          </span>
          <Input value={base} onChange={event => setBase(event.target.value)} />
        </label>
        <label className='space-y-2'>
          <span className='text-sm font-medium'>
            Plus price ({subscriptionNativeTokenSymbol})
          </span>
          <Input value={plus} onChange={event => setPlus(event.target.value)} />
        </label>
        <div className='md:col-span-2'>
          <Button type='submit'>Prepare native update</Button>
        </div>
      </form>

      {supportsTreasuryWithdraw ? (
        <form
          className='grid gap-4 md:grid-cols-2'
          onSubmit={explainPendingNativeDeployment}
        >
          <label className='space-y-2'>
            <span className='text-sm font-medium'>Treasury recipient</span>
            <Input
              value={recipient}
              onChange={event => setRecipient(event.target.value)}
            />
          </label>
          <label className='space-y-2'>
            <span className='text-sm font-medium'>Withdraw amount</span>
            <Input
              value={withdrawAmount}
              onChange={event => setWithdrawAmount(event.target.value)}
            />
          </label>
          <div className='md:col-span-2'>
            <Button type='submit' variant='outline'>
              Prepare native withdraw
            </Button>
          </div>
        </form>
      ) : null}

      {status ? (
        <p className='text-muted-foreground text-sm' role='status'>
          {status}
        </p>
      ) : null}
    </Card>
  )
}
