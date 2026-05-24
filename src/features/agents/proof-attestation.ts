import { createHash } from 'node:crypto'

import type { AgentProof, AgentRun } from '@/features/agents/types'
import { envServer } from '@/lib/env/env.server'
import { getPortaldotExplorerExtrinsicUrl } from '@/lib/portaldot/config'
import { submitPortaldotRemark } from '@/lib/portaldot/remark'

export async function attestAgentRunOnChain(
  run: AgentRun,
  proof: Omit<AgentProof, 'txHash' | 'explorerUrl'>
) {
  const signerUri = envServer.PORTALDOT_AGENT_ATTESTER_URI

  if (!signerUri) {
    return {
      txHash: null,
      explorerUrl: null
    }
  }

  const result = await submitPortaldotRemark({
    signerUri,
    payload: {
      type: 'portalkubo.agent.proof.v1',
      runId: run.id,
      runHash: proofHashToBytes32(run.id),
      ownerWallet: run.ownerWallet,
      proofHash: proof.proofHash,
      proofUri: proof.proofUri,
      createdAt: new Date().toISOString()
    }
  })

  return {
    txHash: result.extrinsicHash as `0x${string}`,
    explorerUrl: getPortaldotExplorerExtrinsicUrl(result.extrinsicHash)
  }
}

function proofHashToBytes32(value: string): `0x${string}` {
  return `0x${createHash('sha256').update(value).digest('hex')}`
}
