import type { MetadataRoute } from 'next'

import { siteConfig } from '@/lib/config/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#07111F',
    icons: [
      {
        src: '/images/app-logo.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'any'
      }
    ]
  }
}
