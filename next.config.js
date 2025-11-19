/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remover output: 'standalone' para permitir servimento de arquivos estáticos
  // output: 'standalone',
  // Desabilitado optimizeCss temporariamente para evitar problemas com CSS
  // experimental: {
  //   optimizeCss: true,
  // },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost', 'rotafinal.com.br'],
  },
  // Configurações de produção
  productionBrowserSourceMaps: false,
  compress: true,
  reactStrictMode: true,

  // Headers CORS para permitir chamadas de sites externos (SaaS)
  // IMPORTANTE: Ordem importa - rotas mais específicas primeiro
  async headers() {
    return [
      {
        // Headers para arquivos CSS do Next.js (mais específico primeiro)
        source: '/_next/static/css/:path*.css',
        headers: [
          { key: 'Content-Type', value: 'text/css; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        // Headers para chunks JavaScript do Next.js (mais específico primeiro)
        source: '/_next/static/chunks/:path*.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        // Headers para outros assets estáticos do Next.js
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        // Aplicar CORS em todas as rotas de API
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-RF-Version, X-Requested-With' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
      {
        // Permitir carregamento de arquivos JavaScript públicos de sites externos (menos específico por último)
        source: '/:path*.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET' },
          { key: 'Timing-Allow-Origin', value: '*' },
        ],
      },
    ]
  },

  // Configurações para evitar ChunkLoadError
  // Removido generateBuildId com timestamp para evitar problemas com vendor-chunks
  // generateBuildId: async () => {
  //   return `build-${Date.now()}`
  // },
  
  // Configurações para servir arquivos estáticos corretamente
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  trailingSlash: false,
  
  // Configurações simplificadas do webpack
  webpack: (config, { isServer }) => {
    // Apenas fallbacks essenciais
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    }
    
    return config
  },
}

module.exports = nextConfig