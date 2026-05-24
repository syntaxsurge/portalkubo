'use client'

import { useEffect, useState } from 'react'

import { Power, RefreshCw, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { WalletAddressConsumer } from '@/components/wallet/wallet-address-consumer'
import { useUserSettings } from '@/hooks/use-user-settings'
import {
  UserSettings,
  defaultUserSettings,
  saveUserSettings
} from '@/lib/settings/user-settings'

export function SubscriptionStatus() {
  return (
    <WalletAddressConsumer>
      {({ address }) => <SubscriptionStatusContent address={address} />}
    </WalletAddressConsumer>
  )
}

function SubscriptionStatusContent({ address }: { address: string | null }) {
  const { settings: persistedSettings } = useUserSettings(address)
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings)
  const [status, setStatus] = useState('')
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    setSettings(persistedSettings)
  }, [persistedSettings])

  async function updateSelectedPlan(plan: UserSettings['plan']) {
    if (!address) {
      setStatus('Connect a Portaldot wallet first.')
      return
    }

    const nextSettings = { ...settings, plan }
    setSettings(nextSettings)
    setIsPending(true)

    try {
      await saveUserSettings(nextSettings, address)
      setStatus('Subscription preference saved.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save plan.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className='space-y-5 p-6'>
      <div>
        <p className='text-foreground/60 text-xs tracking-[0.16em] uppercase'>
          Subscription
        </p>
        <h2 className='mt-2 text-xl font-semibold'>Native plan status</h2>
        <p className='text-muted-foreground mt-2 text-sm leading-6'>
          PortalKubo now uses Portaldot-native wallet sessions. Contract-backed
          recurring billing is ready to connect once the ink! subscription
          manager is deployed.
        </p>
      </div>

      <div className='grid gap-3 sm:grid-cols-3'>
        {(['free', 'base', 'plus'] as const).map(plan => (
          <Button
            key={plan}
            type='button'
            variant={settings.plan === plan ? 'primary' : 'outline'}
            disabled={isPending}
            onClick={() => void updateSelectedPlan(plan)}
          >
            {settings.plan === plan ? (
              <Power className='h-4 w-4' />
            ) : (
              <RotateCcw className='h-4 w-4' />
            )}
            {plan}
          </Button>
        ))}
      </div>

      <Button
        type='button'
        variant='outline'
        disabled={isPending}
        onClick={() => void updateSelectedPlan(settings.plan)}
      >
        <RefreshCw className='h-4 w-4' />
        Refresh status
      </Button>

      {status ? (
        <p className='text-muted-foreground text-sm' role='status'>
          {status}
        </p>
      ) : null}
    </Card>
  )
}
