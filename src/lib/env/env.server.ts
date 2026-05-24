import { z } from 'zod'

const optionalString = z.preprocess(
  value => (value === '' ? undefined : value),
  z.string().optional()
)

const serverSchema = z.object({
  CONVEX_DEPLOYMENT: optionalString,
  PORTALDOT_AGENT_ATTESTER_URI: optionalString,
  NEXT_PUBLIC_API_PAYMENT_ESCROW_ADDRESS: optionalString,
  AGENT_ATTESTER_PRIVATE_KEY: optionalString,
  AGENT_LLM_API_KEY: optionalString,
  AGENT_LLM_MODEL: optionalString,
  NODE_ENV: z.enum(['development', 'test', 'production']).optional()
})

export const envServer = serverSchema.parse({
  CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT,
  PORTALDOT_AGENT_ATTESTER_URI: process.env.PORTALDOT_AGENT_ATTESTER_URI,
  NEXT_PUBLIC_API_PAYMENT_ESCROW_ADDRESS:
    process.env.NEXT_PUBLIC_API_PAYMENT_ESCROW_ADDRESS,
  AGENT_ATTESTER_PRIVATE_KEY: process.env.AGENT_ATTESTER_PRIVATE_KEY,
  AGENT_LLM_API_KEY: process.env.AGENT_LLM_API_KEY,
  AGENT_LLM_MODEL: process.env.AGENT_LLM_MODEL,
  NODE_ENV: process.env.NODE_ENV
})
