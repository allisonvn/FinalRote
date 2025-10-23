/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remover output: 'standalone' para permitir servimento de arquivos estáticos
  // output: 'standalone',
  experimental: {
    optimizeCss: true,
  },
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
  
  // Configurações para evitar ChunkLoadError
  generateBuildId: async () => {
    // Usar timestamp para garantir builds únicos
    return `build-${Date.now()}`
  },
  
  // Configurações para servir arquivos estáticos corretamente
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  trailingSlash: false,
  
  // Configurações do webpack para chunks mais estáveis
  webpack: (config, { isServer, dev }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    }
    
    // Configurações para produção - chunks mais estáveis
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 30,
          maxAsyncRequests: 30,
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
              enforce: true,
            },
            common: {
              name: 'common',
              minChunks: 2,
              priority: -5,
              chunks: 'all',
              enforce: true,
            },
          },
        },
        // Configurações para evitar chunks corrompidos
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
      }
    }
    
    // Interceptar erros de chunk loading no webpack
    config.plugins.push(
      new (require('webpack')).DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      })
    )
    
    return config
  },
}

module.exports = nextConfig