'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import * as React from 'react'

import { useRouter } from 'nextjs-toploader/app'

import { usePolkadotWallet } from '@/lib/wallet/polkadot-wallet-context'

export function ProtectedWalletGuardFrame({
  children,
  isChecking = false,
  isConnected
}: {
  children: React.ReactNode
  isChecking?: boolean
  isConnected: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = React.useState(false)
  const [canRedirect, setCanRedirect] = React.useState(false)

  const currentPath = React.useMemo(() => {
    const query = searchParams.toString()
    return query ? `${pathname}?${query}` : pathname
  }, [pathname, searchParams])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    setCanRedirect(false)

    if (!mounted || isConnected || isChecking) {
      return
    }

    const timeout = window.setTimeout(() => {
      setCanRedirect(true)
    }, 600)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [isChecking, isConnected, mounted])

  React.useEffect(() => {
    if (!canRedirect || isConnected || isChecking) {
      return
    }

    const params = new URLSearchParams({
      next: currentPath,
      auth: 'wallet_required'
    })

    router.replace(`/?${params.toString()}`)
  }, [canRedirect, currentPath, isChecking, isConnected, router])

  if (mounted && isConnected) {
    return <>{children}</>
  }

  return <ProtectedAppSkeleton />
}

export function ProtectedAppSkeleton() {
  return (
    <div className='mx-auto w-full max-w-5xl py-8' aria-live='polite'>
      <div className='mb-8 flex items-center justify-between gap-6'>
        <div className='space-y-3'>
          <div className='skeleton h-3 w-28 rounded-md' />
          <div className='skeleton h-9 w-72 max-w-[70vw] rounded-md' />
        </div>
        <div className='border-foreground/20 border-t-foreground h-8 w-8 animate-spin rounded-full border-2' />
      </div>
      <div className='grid gap-4 md:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className='border-foreground/10 bg-card rounded-lg border p-5'
          >
            <div className='skeleton mb-4 h-3 w-24 rounded-md' />
            <div className='skeleton h-8 w-20 rounded-md' />
          </div>
        ))}
      </div>
      <div className='mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]'>
        <div className='border-foreground/10 bg-card rounded-lg border p-6'>
          <div className='skeleton mb-5 h-5 w-44 rounded-md' />
          <div className='grid gap-3 sm:grid-cols-2'>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className='skeleton h-20 rounded-md' />
            ))}
          </div>
        </div>
        <div className='border-foreground/10 bg-card rounded-lg border p-6'>
          <div className='skeleton mb-5 h-5 w-36 rounded-md' />
          <div className='space-y-3'>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className='skeleton h-10 rounded-md' />
            ))}
          </div>
        </div>
      </div>
      <p className='text-muted-foreground mt-5 text-sm'>
        Checking wallet session...
      </p>
    </div>
  )
}

export function ProtectedAppGuard({ children }: { children: React.ReactNode }) {
  const wallet = usePolkadotWallet()

  return (
    <ProtectedWalletGuardFrame
      isChecking={wallet.isConnecting}
      isConnected={wallet.isConnected}
    >
      {children}
    </ProtectedWalletGuardFrame>
  )
}
