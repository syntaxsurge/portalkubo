import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { ApiPromise, WsProvider } from '@polkadot/api'
import { Keyring } from '@polkadot/keyring'
import { cryptoWaitReady } from '@polkadot/util-crypto'

const endpoint = process.env.PORTALDOT_DEPLOY_WS_URL ?? 'ws://127.0.0.1:9944'
const suri = process.env.PORTALDOT_DEPLOY_SURI ?? '//Alice'
const gasLimit = BigInt(
  process.env.PORTALDOT_DEPLOY_GAS_LIMIT ?? '1200000000000'
)
const endowment = BigInt(
  process.env.PORTALDOT_DEPLOY_ENDOWMENT ?? '1000000000000000'
)
const useLegacyShim = process.env.PORTALDOT_DEPLOY_LEGACY_SHIM === '1'
const legacyShimWasm =
  '0x0061736d01000000010a0260037f7f7f0060000002240203656e76066d656d6f727902010110057365616c300b7365616c5f72657475726e00000303020101071102066465706c6f7900010463616c6c00020a17020a0041004100410010000b0a0041004100410010000b0015046e616d65010e01000b7365616c5f72657475726e'

const contracts = [
  {
    name: 'portal_kubo_proof',
    env: 'NEXT_PUBLIC_PORTALDOT_PROOF_CONTRACT_ADDRESS',
    args: []
  },
  {
    name: 'portal_kubo_budget_vault',
    env: 'NEXT_PUBLIC_PORTALDOT_BUDGET_VAULT_ADDRESS',
    args: []
  },
  {
    name: 'portal_kubo_payment_escrow',
    env: 'NEXT_PUBLIC_PORTALDOT_PAYMENT_ESCROW_ADDRESS',
    args: []
  },
  {
    name: 'portal_kubo_subscription_manager',
    env: 'NEXT_PUBLIC_PORTALDOT_SUBSCRIPTION_MANAGER_ADDRESS',
    args: [100000000000000n, 250000000000000n]
  },
  {
    name: 'portal_kubo_stablecoin',
    env: 'NEXT_PUBLIC_PORTALDOT_STABLECOIN_ADDRESS',
    args: [1000000000000000000n]
  }
]

await cryptoWaitReady()

const api = await ApiPromise.create({ provider: new WsProvider(endpoint) })
const keyring = new Keyring({ type: 'sr25519', ss58Format: 42 })
const deployer = keyring.addFromUri(suri)
const addresses = {}

try {
  for (const contract of contracts) {
    const base = resolve('contracts', contract.name, 'target', 'ink')
    const metadata = JSON.parse(
      readFileSync(resolve(base, `${contract.name}.json`), 'utf8')
    )
    const wasm = useLegacyShim
      ? legacyShimWasm
      : `0x${readFileSync(resolve(base, `${contract.name}.wasm`)).toString(
          'hex'
        )}`
    const data = useLegacyShim ? '0x' : encodeConstructorData(metadata, contract.args)
    const salt = `0x${Buffer.from(`${contract.name}-${Date.now()}`).toString('hex')}`
    const tx = api.tx.contracts.instantiateWithCode(
      endowment,
      gasLimit,
      wasm,
      data,
      salt
    )

    console.log(`Deploying ${contract.name} to ${endpoint}`)
    addresses[contract.env] = await submitAndReadAddress(tx)
    console.log(`${contract.env}=${addresses[contract.env]}`)
  }

  updateEnvFile('.env.local', addresses)
  writeFileSync(
    'contracts/portaldot-local-addresses.json',
    `${JSON.stringify(addresses, null, 2)}\n`
  )
} finally {
  await api.disconnect()
}

async function submitAndReadAddress(tx) {
  const beforeContracts = new Set(
    (await api.query.contracts.contractInfoOf.entries()).map(([key]) =>
      key.args[0].toString()
    )
  )

  return new Promise((resolveAddress, reject) => {
    let unsubscribe

    tx.signAndSend(deployer, async result => {
      if (result.dispatchError) {
        unsubscribe?.()
        reject(new Error(result.dispatchError.toString()))
        return
      }

      if (!result.status.isInBlock && !result.status.isFinalized) {
        return
      }

      const instantiated = result.events.find(
        ({ event }) =>
          event.section === 'contracts' && event.method === 'Instantiated'
      )

      if (instantiated) {
        unsubscribe?.()
        resolveAddress(instantiated.event.data[1].toString())
        return
      }

      try {
        const nextAddress = (
          await api.query.contracts.contractInfoOf.entries()
        )
          .map(([key]) => key.args[0].toString())
          .find(address => !beforeContracts.has(address))

        unsubscribe?.()

        if (!nextAddress) {
          reject(new Error('No deployed contract address was found.'))
          return
        }

        resolveAddress(nextAddress)
      } catch (error) {
        unsubscribe?.()
        reject(error)
      }
    })
      .then(unsub => {
        unsubscribe = unsub
      })
      .catch(reject)
  })
}

function encodeConstructorData(metadata, args) {
  const constructor = metadata.spec.constructors.find(
    candidate => candidate.label === 'new'
  )

  if (!constructor) {
    throw new Error('Missing ink! constructor named "new".')
  }

  const selector = Buffer.from(constructor.selector.replace(/^0x/, ''), 'hex')
  const encodedArgs = args.map(value =>
    api.registry.createType('u128', value).toU8a()
  )

  return `0x${Buffer.concat([selector, ...encodedArgs]).toString('hex')}`
}

function updateEnvFile(path, nextValues) {
  const existing = readFileSync(path, 'utf8')
  const lines = existing.split('\n')
  const seen = new Set()
  const updated = lines.map(line => {
    const [key] = line.split('=')
    if (!Object.hasOwn(nextValues, key)) {
      return line
    }

    seen.add(key)
    return `${key}=${nextValues[key]}`
  })

  for (const [key, value] of Object.entries(nextValues)) {
    if (!seen.has(key)) {
      updated.push(`${key}=${value}`)
    }
  }

  writeFileSync(path, `${updated.filter(Boolean).join('\n')}\n`)
}
