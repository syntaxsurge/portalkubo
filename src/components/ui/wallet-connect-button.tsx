'use client'

import * as React from 'react'

import {
  Check,
  Copy,
  Download,
  ExternalLink,
  LogOut,
  Monitor,
  Smartphone,
  Wallet
} from 'lucide-react'

import { buttonClasses } from '@/components/ui/button'
import {
  ShadcnDialog,
  ShadcnDialogContent,
  ShadcnDialogDescription,
  ShadcnDialogHeader,
  ShadcnDialogTitle
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils/cn'
import { usePolkadotWallet } from '@/lib/wallet/polkadot-wallet-context'

function WalletCheckingButton({
  className,
  variant = 'outline'
}: {
  className?: string
  variant?: 'primary' | 'outline' | 'ghost'
}) {
  return (
    <button
      type='button'
      className={buttonClasses({
        variant,
        size: 'md',
        className: `border-accent/40 bg-accent text-accent-foreground shadow-brand-cyan/20 hover:bg-accent/90 min-w-[11rem] px-5 whitespace-nowrap shadow-sm ${className ?? ''}`
      })}
      disabled
    >
      Connect Wallet
    </button>
  )
}

export function WalletConnectButton({
  className,
  variant = 'outline'
}: {
  className?: string
  variant?: 'primary' | 'outline' | 'ghost'
}) {
  const [mounted, setMounted] = React.useState(false)
  const [installDialogOpen, setInstallDialogOpen] = React.useState(false)
  const [accountDialogOpen, setAccountDialogOpen] = React.useState(false)
  const wallet = usePolkadotWallet()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (wallet.error) {
      setInstallDialogOpen(true)
    }
  }, [wallet.error])

  if (!mounted) {
    return <WalletCheckingButton className={className} variant={variant} />
  }

  if (!wallet.isConnected) {
    return (
      <>
        <button
          type='button'
          className={buttonClasses({
            variant,
            size: 'md',
            className: cn('min-w-[11rem] px-5 whitespace-nowrap', className)
          })}
          disabled={wallet.isConnecting}
          onClick={() => {
            if (!hasInjectedPolkadotWallet()) {
              setInstallDialogOpen(true)
              return
            }

            void wallet.connect()
          }}
        >
          {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
        <WalletInstallDialog
          open={installDialogOpen}
          onOpenChange={setInstallDialogOpen}
        />
      </>
    )
  }

  return (
    <>
      <button
        type='button'
        className={buttonClasses({
          variant: 'outline',
          size: 'md',
          className: cn('min-w-[11rem] px-5 whitespace-nowrap', className)
        })}
        onClick={() => setAccountDialogOpen(true)}
        title={`Open ${wallet.selectedAccount?.source ?? 'wallet'} account`}
      >
        {shortenAddress(wallet.address)}
      </button>
      <WalletAccountDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        address={wallet.address}
        accountName={wallet.selectedAccount?.name ?? 'Wallet account'}
        walletSource={wallet.selectedAccount?.source ?? 'wallet'}
        onDisconnect={() => {
          wallet.disconnect()
          setAccountDialogOpen(false)
        }}
      />
    </>
  )
}

function WalletAccountDialog({
  open,
  onOpenChange,
  address,
  accountName,
  walletSource,
  onDisconnect
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  address: string | null
  accountName: string
  walletSource: string
  onDisconnect: () => void
}) {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      setCopied(false)
    }
  }, [open])

  const copyAddress = React.useCallback(async () => {
    if (!address) {
      return
    }

    await navigator.clipboard.writeText(address)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }, [address])

  return (
    <ShadcnDialog open={open} onOpenChange={onOpenChange}>
      <ShadcnDialogContent
        className='z-[110] max-w-md'
        overlayClassName='z-[100]'
      >
        <ShadcnDialogHeader>
          <ShadcnDialogTitle>Wallet connected</ShadcnDialogTitle>
          <ShadcnDialogDescription>
            Manage the account connected to PortalKubo.
          </ShadcnDialogDescription>
        </ShadcnDialogHeader>

        <div className='space-y-5'>
          <div className='border-border bg-muted/30 rounded-lg border p-4'>
            <div className='flex items-start gap-3'>
              <span className='bg-primary text-primary-foreground grid h-11 w-11 shrink-0 place-items-center rounded-lg'>
                <Wallet className='h-5 w-5' aria-hidden />
              </span>
              <div className='min-w-0'>
                <p className='truncate text-sm font-semibold'>{accountName}</p>
                <p className='text-muted-foreground mt-1 text-xs capitalize'>
                  {walletSource}
                </p>
                <p className='mt-3 font-mono text-sm break-all'>
                  {address ?? 'No account selected'}
                </p>
              </div>
            </div>
          </div>

          <div className='grid gap-3 sm:grid-cols-2'>
            <button
              type='button'
              className={buttonClasses({
                variant: 'outline',
                size: 'md',
                className: 'w-full'
              })}
              onClick={() => void copyAddress()}
              disabled={!address}
            >
              {copied ? (
                <Check className='h-4 w-4' aria-hidden />
              ) : (
                <Copy className='h-4 w-4' aria-hidden />
              )}
              {copied ? 'Copied' : 'Copy address'}
            </button>
            <button
              type='button'
              className={buttonClasses({
                variant: 'outline',
                size: 'md',
                className:
                  'border-destructive/35 text-destructive hover:border-destructive/60 hover:bg-destructive/10'
              })}
              onClick={onDisconnect}
            >
              <LogOut className='h-4 w-4' aria-hidden />
              Disconnect
            </button>
          </div>
        </div>
      </ShadcnDialogContent>
    </ShadcnDialog>
  )
}

function WalletInstallDialog({
  open,
  onOpenChange
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    setIsMobile(
      /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent)
    )
  }, [])

  const recommendedWallets = isMobile ? mobileWallets : desktopWallets
  const secondaryWallets = isMobile ? desktopWallets : mobileWallets

  return (
    <ShadcnDialog open={open} onOpenChange={onOpenChange}>
      <ShadcnDialogContent className='max-w-2xl'>
        <ShadcnDialogHeader>
          <ShadcnDialogTitle>Install a Portaldot wallet</ShadcnDialogTitle>
          <ShadcnDialogDescription>
            PortalKubo needs a Polkadot.js-compatible wallet to read your
            account and sign Portaldot transactions.
          </ShadcnDialogDescription>
        </ShadcnDialogHeader>

        <div className='space-y-5'>
          <div className='border-border bg-muted/30 rounded-lg border p-4'>
            <div className='flex items-start gap-3'>
              {isMobile ? (
                <Smartphone className='text-primary mt-0.5 h-5 w-5 shrink-0' />
              ) : (
                <Monitor className='text-primary mt-0.5 h-5 w-5 shrink-0' />
              )}
              <div className='min-w-0'>
                <p className='text-sm font-semibold'>
                  {isMobile
                    ? 'You are on a mobile browser'
                    : 'You are on a desktop browser'}
                </p>
                <p className='text-muted-foreground mt-1 text-sm leading-6'>
                  {isMobile
                    ? 'Install a supported mobile wallet, then open PortalKubo from that wallet app if it provides a dApp browser.'
                    : 'Install one supported browser extension, create or import an account, refresh PortalKubo, then connect again.'}
                </p>
              </div>
            </div>
          </div>

          <WalletLinkList
            title='Recommended for this device'
            wallets={recommendedWallets}
          />
          <WalletLinkList
            title='Other supported options'
            wallets={secondaryWallets}
          />
        </div>
      </ShadcnDialogContent>
    </ShadcnDialog>
  )
}

function WalletLinkList({
  title,
  wallets
}: {
  title: string
  wallets: WalletInstallOption[]
}) {
  return (
    <section className='space-y-3'>
      <h3 className='text-sm font-semibold'>{title}</h3>
      <div className='grid gap-3'>
        {wallets.map(wallet => (
          <a
            key={wallet.href}
            href={wallet.href}
            target='_blank'
            rel='noreferrer'
            className='border-border bg-card hover:border-primary/50 hover:bg-accent/10 flex items-center justify-between gap-4 rounded-lg border p-4 transition'
          >
            <span className='min-w-0'>
              <span className='block text-sm font-semibold'>{wallet.name}</span>
              <span className='text-muted-foreground mt-1 block text-sm leading-5'>
                {wallet.description}
              </span>
            </span>
            <span className='bg-primary text-primary-foreground inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg'>
              {wallet.primary ? (
                <Download className='h-4 w-4' aria-hidden />
              ) : (
                <ExternalLink className='h-4 w-4' aria-hidden />
              )}
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}

type WalletInstallOption = {
  name: string
  description: string
  href: string
  primary?: boolean
}

const desktopWallets: WalletInstallOption[] = [
  {
    name: 'SubWallet Extension',
    description: 'Chrome, Brave, Edge, Firefox, and other desktop browsers.',
    href: 'https://www.subwallet.app/download',
    primary: true
  },
  {
    name: 'Talisman Extension',
    description: 'Desktop extension for Chromium browsers and Firefox.',
    href: 'https://talisman.xyz/download'
  },
  {
    name: 'Polkadot.js Extension',
    description: 'Developer signer extension for Chrome and Firefox.',
    href: 'https://polkadot.js.org/extension/'
  }
]

const mobileWallets: WalletInstallOption[] = [
  {
    name: 'SubWallet Mobile',
    description: 'Official mobile wallet for iOS and Android.',
    href: 'https://www.subwallet.app/download',
    primary: true
  },
  {
    name: 'SubWallet on App Store',
    description: 'Direct iOS download.',
    href: 'https://apps.apple.com/us/app/subwallet-polkadot-wallet/id1633050285'
  },
  {
    name: 'SubWallet on Google Play',
    description: 'Direct Android download.',
    href: 'https://play.google.com/store/apps/details?id=app.subwallet.mobile'
  }
]

function hasInjectedPolkadotWallet() {
  if (typeof window === 'undefined') {
    return false
  }

  return Boolean((window as Window & { injectedWeb3?: unknown }).injectedWeb3)
}

function shortenAddress(address: string | null) {
  if (!address) {
    return 'Wallet'
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
