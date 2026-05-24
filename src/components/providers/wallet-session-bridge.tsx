'use client'

import { usePathname, useRouter } from 'next/navigation'
import * as React from 'react'

import {
  WALLET_ADDRESS_COOKIE,
  WALLET_SESSION_COOKIE,
  WALLET_SESSION_COOKIE_VALUE,
  WALLET_SESSION_MAX_AGE_SECONDS
} from '@/lib/auth/wallet-session'
import {
  clearUserSettings,
  UserSettings,
  writeUserSettings
} from '@/lib/settings/user-settings'
import { usePolkadotWallet } from '@/lib/wallet/polkadot-wallet-context'

type AuthSessionResponse = {
  settings?: UserSettings | null
}

async function syncWalletSession(isConnected: boolean, address?: string) {
  if (isConnected && address) {
    writeWalletSessionCookies(address)

    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        walletAddress: address
      })
    })
    const body = (await response
      .json()
      .catch(() => null)) as AuthSessionResponse | null

    if (response.ok && body?.settings) {
      writeUserSettings(body.settings, address)
    }

    return
  }

  clearWalletSessionCookies()
  await fetch('/api/auth', {
    method: 'DELETE'
  }).catch(() => undefined)
  clearUserSettings(address)
}

function useWalletSessionCookie(
  isConnected: boolean,
  isChecking = false,
  address?: string
) {
  const pathname = usePathname()
  const router = useRouter()
  const redirectedWalletRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (isConnected) {
      if (!address) {
        return
      }

      void syncWalletSession(true, address).then(() => {
        const walletAddress = address?.toLowerCase()
        router.refresh()

        if (
          walletAddress &&
          redirectedWalletRef.current !== walletAddress &&
          shouldRedirectAfterWalletConnect(pathname)
        ) {
          redirectedWalletRef.current = walletAddress
          router.push('/dashboard')
        }
      })
      return
    }

    if (isChecking) {
      return
    }

    const timeout = window.setTimeout(() => {
      redirectedWalletRef.current = null
      void syncWalletSession(false, address)
    }, 600)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [address, isChecking, isConnected, pathname, router])
}

function shouldRedirectAfterWalletConnect(pathname: string) {
  return ![
    '/dashboard',
    '/agents',
    '/marketplace',
    '/orders',
    '/receipts',
    '/provider',
    '/profile',
    '/billing',
    '/settings',
    '/admin'
  ].some(path => pathname === path || pathname.startsWith(`${path}/`))
}

function writeWalletSessionCookies(address: string) {
  const normalizedAddress = address.trim()
  const maxAge = `Max-Age=${WALLET_SESSION_MAX_AGE_SECONDS}`
  const cookieOptions = `${maxAge}; Path=/; SameSite=Lax`

  document.cookie = `${WALLET_SESSION_COOKIE}=${WALLET_SESSION_COOKIE_VALUE}; ${cookieOptions}`
  document.cookie = `${WALLET_ADDRESS_COOKIE}=${normalizedAddress}; ${cookieOptions}`
}

function clearWalletSessionCookies() {
  const expiredCookieOptions = 'Max-Age=0; Path=/; SameSite=Lax'

  document.cookie = `${WALLET_SESSION_COOKIE}=; ${expiredCookieOptions}`
  document.cookie = `${WALLET_ADDRESS_COOKIE}=; ${expiredCookieOptions}`
}

export function WalletSessionBridge() {
  const wallet = usePolkadotWallet()

  useWalletSessionCookie(
    wallet.isConnected,
    wallet.isConnecting,
    wallet.address ?? undefined
  )

  return null
}
