import { NextResponse } from 'next/server'

import { paymentNetwork } from '@/lib/config/chains'

export function GET() {
  return NextResponse.json({
    openapi: '3.1.0',
    info: {
      title: 'PortalKubo API',
      version: '1.0.0',
      description:
        'Portaldot-native paid API marketplace, managed credits, and AI workflow proof endpoints.'
    },
    tags: [
      { name: 'orders' },
      { name: 'credits' },
      { name: 'agents' },
      { name: 'proofs' }
    ],
    paths: {
      '/api/orders': {
        post: {
          tags: ['orders'],
          summary: 'Create a marketplace order'
        }
      },
      '/api/orders/{orderId}': {
        get: {
          tags: ['orders'],
          summary: 'Read an order'
        }
      },
      '/api/credits/products/{slug}/call': {
        post: {
          tags: ['credits'],
          summary: 'Run a Portaldot-native paid API call'
        }
      },
      '/api/agents/runs': {
        post: {
          tags: ['agents'],
          summary: 'Create an AI workflow run'
        }
      },
      '/api/agents/runs/{runId}/execute': {
        post: {
          tags: ['agents'],
          summary: 'Execute an AI workflow run'
        }
      }
    },
    components: {
      schemas: {
        Network: {
          type: 'string',
          enum: [paymentNetwork]
        }
      }
    }
  })
}
