import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ArrowLeft, Bot, Code2, Play } from 'lucide-react'

import { JsonViewer } from '@/components/data-display/json-viewer'
import { Badge } from '@/components/ui/badge'
import { buttonClasses } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getProductBySlug } from '@/features/marketplace/products'

type ProductPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function MarketplaceProductPage({
  params
}: ProductPageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const endpoint = `/api/credits/products/${product.slug}/call`
  const buyerIntegrationCode = `const response = await fetch("${endpoint}", {
  method: "${product.method}",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(${JSON.stringify(product.referencePayload, null, 2)})
});

const result = await response.json();`

  return (
    <div className='space-y-6'>
      <Link
        href='/marketplace'
        className='text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium'
      >
        <ArrowLeft className='h-4 w-4' />
        Marketplace
      </Link>

      <Card className='p-6'>
        <div className='flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between'>
          <div>
            <div className='mb-3 flex flex-wrap items-center gap-2'>
              <Badge>{product.category}</Badge>
              {product.isNativePaymentProtected ? (
                <Badge>Portaldot payment</Badge>
              ) : null}
              {product.isAgentReady ? <Badge>Agent-ready</Badge> : null}
            </div>
            <h1 className='text-3xl font-semibold tracking-tight'>
              {product.name}
            </h1>
            <p className='text-muted-foreground mt-3 max-w-3xl text-sm leading-6'>
              {product.description}
            </p>
          </div>
          <Link
            href={`/orders/new?product=${product.slug}`}
            className={buttonClasses({ variant: 'primary', size: 'md' })}
          >
            <Play className='h-4 w-4' />
            Create order
          </Link>
        </div>
      </Card>

      <div className='grid gap-4 md:grid-cols-3'>
        <Metric label='Provider' value={product.providerName} />
        <Metric label='Price' value={product.priceLabel} />
        <Metric label='Latency' value={product.estimatedLatency} />
      </div>

      <Card className='p-6'>
        <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold'>
          <Code2 className='h-5 w-5' />
          Native endpoint
        </h2>
        <pre className='bg-muted overflow-auto rounded-md p-4 text-sm'>
          <code>{buyerIntegrationCode}</code>
        </pre>
      </Card>

      <Card className='p-6'>
        <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold'>
          <Bot className='h-5 w-5' />
          Reference payload
        </h2>
        <JsonViewer value={product.referencePayload} title='Payload JSON' />
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className='p-5'>
      <p className='text-muted-foreground text-sm'>{label}</p>
      <p className='mt-2 truncate text-lg font-semibold'>{value}</p>
    </Card>
  )
}
