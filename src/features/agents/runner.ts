import {
  type AgentPlanMetadata,
  buildAgentPlan,
  buildPlannerSummary
} from '@/features/agents/planner'
import type { AgentAction, AgentRun } from '@/features/agents/types'
import { resolveProductPrice } from '@/features/marketplace/pricing'
import { getProductBySlug } from '@/features/marketplace/products'

type AgentRunProgress = {
  actions: AgentAction[]
  summary?: string
}

type AgentRunProgressHandler = (
  progress: AgentRunProgress
) => Promise<void> | void

export async function executeAgentRunActions(
  run: AgentRun,
  shouldStop: () => boolean = () => false,
  _appUrl?: string,
  onProgress?: AgentRunProgressHandler
) {
  const plan =
    run.actions.length > 0
      ? {
          actions: run.actions,
          metadata: buildPlannerSummary(run, run.actions)
        }
      : await buildAgentPlan(run)
  const completedActions: AgentAction[] = []

  await onProgress?.({
    actions: plan.actions,
    summary: `The agent planned ${plan.actions.length} Portaldot-native workflow action${
      plan.actions.length === 1 ? '' : 's'
    }.`
  })

  for (const action of plan.actions) {
    if (shouldStop()) {
      completedActions.push({
        ...action,
        status: 'failed',
        errorMessage: 'The agent run was stopped before this action executed.',
        completedAt: new Date().toISOString()
      })
      break
    }

    const completed = await executeNativeAction(action)
    completedActions.push(completed)
    await onProgress?.({
      actions: plan.actions.map(nextAction =>
        nextAction.id === completed.id ? completed : nextAction
      ),
      summary: `Completed ${completed.productName} through the Portaldot-native workflow path.`
    })
  }

  const completed = completedActions.every(
    action => action.status === 'completed'
  )

  return {
    actions: completedActions,
    deliverables: buildDeliverables(run, completedActions, plan.metadata),
    summary: completed
      ? `The agent completed ${completedActions.length} Portaldot-native workflow action${
          completedActions.length === 1 ? '' : 's'
        } and prepared proof data for on-chain anchoring.`
      : 'The agent stopped before completing every workflow action.',
    status: completed ? 'completed' : 'failed'
  } as const
}

async function executeNativeAction(action: AgentAction): Promise<AgentAction> {
  const product = await getProductBySlug(action.productSlug)

  if (!product) {
    return {
      ...action,
      status: 'failed',
      errorMessage: 'API product was not found.',
      completedAt: new Date().toISOString()
    }
  }

  const quote = await resolveProductPrice({
    product,
    requestPayload: action.requestPayload
  }).catch(error => ({
    error: error instanceof Error ? error.message : 'Unable to quote product.'
  }))

  if ('error' in quote) {
    return {
      ...action,
      status: 'failed',
      errorMessage: quote.error,
      completedAt: new Date().toISOString()
    }
  }

  return {
    ...action,
    status: 'completed',
    amountUsdc: quote.amountUsd.toFixed(2),
    responsePayload: {
      mode: 'portaldot-native',
      product: product.slug,
      provider: product.providerName,
      request: action.requestPayload,
      quote
    },
    completedAt: new Date().toISOString()
  }
}

function buildDeliverables(
  run: AgentRun,
  actions: AgentAction[],
  metadata: AgentPlanMetadata
): AgentRun['deliverables'] {
  return {
    plannerMode: metadata.plannerMode,
    plannerModel: metadata.plannerModel,
    plannerResponseId: metadata.plannerResponseId,
    planningPrompt: metadata.planningPrompt,
    toolSelectionRationale: metadata.toolSelectionRationale,
    skippedTools: metadata.skippedTools,
    expectedDeliverables: metadata.expectedDeliverables,
    budgetInstruction: metadata.budgetInstruction,
    budgetStrategy: metadata.budgetStrategy,
    synthesisInstructions: metadata.synthesisInstructions,
    proofExplanation:
      'PortalKubo hashes the workflow payload and anchors the proof on Portaldot with native POT gas.',
    launchBrief: [
      `# ${run.title}`,
      '',
      run.objective,
      '',
      `Completed actions: ${actions.filter(action => action.status === 'completed').length}/${actions.length}.`
    ].join('\n')
  }
}
