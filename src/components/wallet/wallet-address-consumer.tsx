'use client'

import * as React from 'react'

import { usePolkadotWallet } from '@/lib/wallet/polkadot-wallet-context'

type WalletAddressConsumerProps = {
  children: (wallet: {
    address: string | null
    isConnected: boolean
  }) => React.ReactNode
}

export function WalletAddressConsumer({
  children
}: WalletAddressConsumerProps) {
  const wallet = usePolkadotWallet()

  return children({
    address: wallet.address,
    isConnected: wallet.isConnected
  })
}
