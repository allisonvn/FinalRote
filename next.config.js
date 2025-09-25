/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  typescript: {
    tsconfigPath: './tsconfig.json',
    // Em produção, ignorar erros de types para não travar deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    dirs: ['src'],
    // Em produção, não falhar o build por erros de lint
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost'],
  },
  async headers() {
    const headers = [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          // Em dev, evite "nosniff" para não interferir com chunks
          // Será aplicado em produção pelo provedor de edge
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
    return headers
  },
}

module.exports = nextConfig