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
  // Configurações para resolver problemas de chunk loading
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Configuração otimizada para desenvolvimento
      config.optimization = {
        ...config.optimization,
        runtimeChunk: false,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 1,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
          },
        },
      }
      
      // Configuração de timeout mais generosa
      config.devServer = {
        ...config.devServer,
        hot: true,
        liveReload: true,
        client: {
          overlay: {
            errors: true,
            warnings: false,
          },
        },
      }
    }

    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve?.fallback,
        fs: false,
        net: false,
        tls: false,
      },
    }

    // Configuração para melhor handling de chunks
    config.output = {
      ...config.output,
      chunkLoadingGlobal: 'webpackChunkRotaFinal',
    }

    return config
  },
  // Configurações experimentais otimizadas
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
    // Melhorar estabilidade do desenvolvimento
    webpackBuildWorker: false,
  },
  // Configurações de desenvolvimento
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
}

module.exports = nextConfig