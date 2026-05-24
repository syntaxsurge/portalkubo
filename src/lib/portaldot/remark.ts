import { ApiPromise, WsProvider } from '@polkadot/api'
import { Keyring } from '@polkadot/keyring'
import { cryptoWaitReady } from '@polkadot/util-crypto'

import { portaldotConfig } from '@/lib/portaldot/config'

export type PortaldotRemarkResult = {
  extrinsicHash: string
  blockHash: string | null
}

export async function submitPortaldotRemark({
  signerUri,
  payload
}: {
  signerUri: string
  payload: unknown
}): Promise<PortaldotRemarkResult> {
  await cryptoWaitReady()

  const provider = new WsProvider(portaldotConfig.wsUrl)
  const api = await ApiPromise.create({ provider })

  try {
    const keyring = new Keyring({
      type: 'sr25519',
      ss58Format: portaldotConfig.ss58Format
    })
    const signer = keyring.addFromUri(signerUri)
    const remarkPayload = JSON.stringify(payload)
    const extrinsicHash = api.tx.system.remark(remarkPayload).hash.toHex()
    const blockHash = await signAndSendRemark(api, signer, remarkPayload)

    return {
      extrinsicHash,
      blockHash
    }
  } finally {
    await api.disconnect()
  }
}

function signAndSendRemark(
  api: ApiPromise,
  signer: ReturnType<Keyring['addFromUri']>,
  payload: string
) {
  return new Promise<string | null>((resolve, reject) => {
    let unsubscribe: (() => void) | undefined

    api.tx.system
      .remark(payload)
      .signAndSend(signer, result => {
        if (result.dispatchError) {
          const error = result.dispatchError
          unsubscribe?.()
          reject(new Error(error.toString()))
          return
        }

        if (result.status.isInBlock || result.status.isFinalized) {
          const blockHash = result.status.isInBlock
            ? result.status.asInBlock.toHex()
            : result.status.asFinalized.toHex()
          unsubscribe?.()
          resolve(blockHash)
        }
      })
      .then(unsub => {
        unsubscribe = unsub
      })
      .catch(reject)
  })
}
