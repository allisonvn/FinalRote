/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    tsconfigPath: './tsconfig.json',
    ignoreBuildErrors: true,
  },
  eslint: {
    dirs: ['src'],
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost'],
  },
  
  // Configurações de produção otimizadas
  productionBrowserSourceMaps: false,
  compress: true,
  reactStrictMode: true,
  
  // Configurações para resolver ChunkLoadError
  experimental: {
    optimizeCss: true,
  },
  
  // Configurações de output para produção
  output: 'standalone',
  
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
          minSize: 20000,
          maxSize: 244000,
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
            },
            common: {
              name: 'common',
              minChunks: 2,
              priority: -5,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }
    
    // Configurações para resolver problemas de chunk loading
    config.output = {
      ...config.output,
      chunkLoadingGlobal: 'webpackChunkrotafinal',
      globalObject: 'self',
    }
    
    return config
  },
  
  // Headers para assets estáticos
  async headers() {
    return [
      {
        source: '/_next/static/chunks/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
