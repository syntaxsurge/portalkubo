'use client'

import { useState } from 'react'

import { Check, CreditCard } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { WalletAddressConsumer } from '@/components/wallet/wallet-address-consumer'
import { subscriptionPlans } from '@/lib/contracts/subscription'
import {
  readUserSettings,
  saveUserSettings
} from '@/lib/settings/user-settings'

export function SubscriptionCheckout({
  planKey
}: {
  planKey: 'free' | 'base' | 'plus'
}) {
  return (
    <WalletAddressConsumer>
      {({ address }) => (
        <SubscriptionCheckoutButton planKey={planKey} address={address} />
      )}
    </WalletAddressConsumer>
  )
}

function SubscriptionCheckoutButton({
  planKey,
  address
}: {
  planKey: 'free' | 'base' | 'plus'
  address: string | null
}) {
  const [status, setStatus] = useState('')
  const [isPending, setIsPending] = useState(false)
  const plan = subscriptionPlans.find(item => item.key === planKey)

  if (!plan) {
    return null
  }
  const selectedPlan = plan

  async function selectPlan() {
    if (!address) {
      setStatus('Connect a Portaldot wallet first.')
      return
    }

    setIsPending(true)
    try {
      const settings = readUserSettings(address)
      await saveUserSettings({ ...settings, plan: selectedPlan.key }, address)
      setStatus(
        selectedPlan.key === 'free'
          ? 'Free plan selected.'
          : 'Plan selected. Native subscription contract payment is available after deployment.'
      )
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save plan.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className='space-y-2'>
      <Button
        type='button'
        className='w-full text-center whitespace-normal sm:whitespace-nowrap'
        disabled={isPending || !address}
        onClick={() => void selectPlan()}
      >
        {plan.key === 'free' ? (
          <Check className='h-4 w-4' aria-hidden />
        ) : (
          <CreditCard className='h-4 w-4' aria-hidden />
        )}
        {isPending
          ? 'Saving...'
          : selectedPlan.key === 'free'
            ? 'Use free plan'
            : 'Select plan'}
      </Button>
      {status ? (
        <p className='text-foreground/60 text-xs leading-5' role='status'>
          {status}
        </p>
      ) : null}
    </div>
  )
}
