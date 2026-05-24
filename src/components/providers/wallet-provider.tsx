'use client'

import * as React from 'react'

import { WalletSessionBridge } from '@/components/providers/wallet-session-bridge'
import { PolkadotWalletProvider } from '@/lib/wallet/polkadot-wallet-context'

const WalletRuntimeContext = React.createContext(false)

export function useWalletRuntimeReady() {
  return React.useContext(WalletRuntimeContext)
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <PolkadotWalletProvider>
      <WalletRuntimeContext.Provider value>
        <WalletSessionBridge />
        {children}
      </WalletRuntimeContext.Provider>
    </PolkadotWalletProvider>
  )
}
