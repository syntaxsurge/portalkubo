'use client'

import * as React from 'react'

import type { Signer } from '@polkadot/api/types'

import { siteConfig } from '@/lib/config/site'
import { portaldotConfig } from '@/lib/portaldot/config'

export type PolkadotWalletAccount = {
  address: string
  name: string
  source: string
}

type PolkadotWalletContextValue = {
  accounts: PolkadotWalletAccount[]
  selectedAccount: PolkadotWalletAccount | null
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  error: string
  connect: () => Promise<void>
  disconnect: () => void
  selectAccount: (address: string) => void
  getSigner: (address?: string) => Promise<Signer>
}

type InjectedAccountWithMeta = {
  address: string
  meta: {
    name?: string
    source: string
  }
}

const PolkadotWalletContext =
  React.createContext<PolkadotWalletContextValue | null>(null)

const selectedAccountStorageKey = 'portalkubo:selected-polkadot-account'

export function PolkadotWalletProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [accounts, setAccounts] = React.useState<PolkadotWalletAccount[]>([])
  const [selectedAddress, setSelectedAddress] = React.useState<string | null>(
    null
  )
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [error, setError] = React.useState('')

  const normalizeAccounts = React.useCallback(
    (nextAccounts: InjectedAccountWithMeta[]) =>
      nextAccounts.map(account => ({
        address: account.address,
        name: account.meta.name ?? 'Wallet account',
        source: account.meta.source
      })),
    []
  )

  const connect = React.useCallback(async () => {
    setIsConnecting(true)
    setError('')

    try {
      const { web3Accounts, web3Enable } = await import(
        '@polkadot/extension-dapp'
      )
      const extensions = await web3Enable(siteConfig.name)

      if (extensions.length === 0) {
        throw new Error(
          'Install a Polkadot.js-compatible wallet such as SubWallet, Talisman, or Polkadot.js, then allow PortalKubo to access it.'
        )
      }

      const injectedAccounts = await web3Accounts({
        ss58Format: portaldotConfig.ss58Format
      })
      const nextAccounts = normalizeAccounts(injectedAccounts)

      if (nextAccounts.length === 0) {
        throw new Error(
          'No Portaldot-compatible accounts were shared with PortalKubo.'
        )
      }

      setAccounts(nextAccounts)
      setSelectedAddress(current => {
        const stored =
          current ??
          window.localStorage.getItem(selectedAccountStorageKey) ??
          nextAccounts[0]?.address ??
          null
        const selected =
          nextAccounts.find(account => account.address === stored) ??
          nextAccounts[0]

        if (selected) {
          window.localStorage.setItem(
            selectedAccountStorageKey,
            selected.address
          )
        }

        return selected?.address ?? null
      })
    } catch (connectError) {
      setError(
        connectError instanceof Error
          ? connectError.message
          : 'Could not connect the Portaldot wallet.'
      )
      setAccounts([])
      setSelectedAddress(null)
    } finally {
      setIsConnecting(false)
    }
  }, [normalizeAccounts])

  React.useEffect(() => {
    if (!selectedAddress) {
      return
    }

    let unsubscribe: (() => void) | undefined
    let isMounted = true

    void import('@polkadot/extension-dapp').then(({ web3AccountsSubscribe }) =>
      web3AccountsSubscribe(
        injectedAccounts => {
          if (!isMounted) {
            return
          }

          const nextAccounts = normalizeAccounts(injectedAccounts)
          setAccounts(nextAccounts)

          if (
            nextAccounts.length > 0 &&
            !nextAccounts.some(account => account.address === selectedAddress)
          ) {
            const nextSelected = nextAccounts[0]
            setSelectedAddress(nextSelected.address)
            window.localStorage.setItem(
              selectedAccountStorageKey,
              nextSelected.address
            )
          }
        },
        { ss58Format: portaldotConfig.ss58Format }
      ).then(nextUnsubscribe => {
        unsubscribe = nextUnsubscribe
      })
    )

    return () => {
      isMounted = false
      unsubscribe?.()
    }
  }, [normalizeAccounts, selectedAddress])

  const disconnect = React.useCallback(() => {
    window.localStorage.removeItem(selectedAccountStorageKey)
    setSelectedAddress(null)
    setAccounts([])
    setError('')
  }, [])

  const selectAccount = React.useCallback(
    (address: string) => {
      if (!accounts.some(account => account.address === address)) {
        return
      }

      window.localStorage.setItem(selectedAccountStorageKey, address)
      setSelectedAddress(address)
    },
    [accounts]
  )

  const getSigner = React.useCallback(
    async (address?: string) => {
      const signerAddress = address ?? selectedAddress

      if (!signerAddress) {
        throw new Error('Connect a Portaldot wallet before signing.')
      }

      const { web3FromAddress } = await import('@polkadot/extension-dapp')
      const injector = await web3FromAddress(signerAddress)
      return injector.signer
    },
    [selectedAddress]
  )

  const selectedAccount =
    accounts.find(account => account.address === selectedAddress) ?? null

  const value = React.useMemo<PolkadotWalletContextValue>(
    () => ({
      accounts,
      selectedAccount,
      address: selectedAccount?.address ?? null,
      isConnected: Boolean(selectedAccount),
      isConnecting,
      error,
      connect,
      disconnect,
      selectAccount,
      getSigner
    }),
    [
      accounts,
      connect,
      disconnect,
      error,
      getSigner,
      isConnecting,
      selectAccount,
      selectedAccount
    ]
  )

  return (
    <PolkadotWalletContext.Provider value={value}>
      {children}
    </PolkadotWalletContext.Provider>
  )
}

export function usePolkadotWallet() {
  const context = React.useContext(PolkadotWalletContext)

  if (!context) {
    throw new Error('usePolkadotWallet must be used inside WalletProvider.')
  }

  return context
}
