import 'server-only'

import { promises as fs } from 'node:fs'
import type { Dirent } from 'node:fs'
import path from 'node:path'

import {
  getExplorerAddressUrl,
  getSubscriptionChain
} from '@/lib/config/chains'
import { siteConfig } from '@/lib/config/site'
import { walletProvider } from '@/lib/config/wallet'
import { envClient } from '@/lib/env/env.client'
import { portaldotConfig } from '@/lib/portaldot/config'

const ROOT = process.cwd()
const CONTRACTS_DIR = path.join(ROOT, 'contracts')
const PACKAGE_JSON = path.join(ROOT, 'package.json')

async function pathExists(target: string) {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

async function listInkContracts(baseDir: string) {
  const contracts: string[] = []

  async function walk(dir: string) {
    let entries: Dirent[]
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.isFile() && entry.name === 'Cargo.toml') {
        const relative = path
          .relative(baseDir, path.dirname(fullPath))
          .replace(/\\/g, '/')
        contracts.push(relative)
      }
    }
  }

  await walk(baseDir)

  return contracts.sort()
}

async function readPackageJson() {
  try {
    const raw = await fs.readFile(PACKAGE_JSON, 'utf8')
    return JSON.parse(raw) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
      scripts?: Record<string, string>
    }
  } catch {
    return {}
  }
}

export async function getProjectSnapshot() {
  const subscriptionChain = getSubscriptionChain()
  const [contracts, hasInkContracts, pkg] = await Promise.all([
    listInkContracts(CONTRACTS_DIR),
    pathExists(CONTRACTS_DIR),
    readPackageJson()
  ])

  const deps = pkg.dependencies ?? {}
  const devDeps = pkg.devDependencies ?? {}
  const getVersion = (name: string) => deps[name] ?? devDeps[name] ?? null

  return {
    appName: siteConfig.name,
    appDescription: siteConfig.description,
    appUrl: siteConfig.url,
    walletProvider,
    walletProviderLabel: 'Polkadot-compatible injected wallet',
    hasInjectedWalletSupport: true,
    convexUrl: envClient.NEXT_PUBLIC_CONVEX_URL ?? null,
    subscriptionManagerAddress:
      envClient.NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS ?? null,
    subscriptionManagerExplorerUrl: getExplorerAddressUrl(
      envClient.NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS
    ),
    subscriptionChain: {
      id: subscriptionChain.id,
      name: subscriptionChain.shortName,
      explorerName: subscriptionChain.explorer.name,
      nativeTokenSymbol: portaldotConfig.tokenSymbol
    },
    contracts,
    contractCount: contracts.length,
    tooling: hasInkContracts ? ['ink!', 'cargo-contract'] : ['Not configured'],
    versions: {
      next: getVersion('next'),
      react: getVersion('react'),
      convex: getVersion('convex'),
      polkadotApi: getVersion('@polkadot/api'),
      polkadotExtension: getVersion('@polkadot/extension-dapp')
    },
    scripts: Object.keys(pkg.scripts ?? {}).sort()
  }
}
