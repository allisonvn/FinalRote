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
  // Configurações de produção
  productionBrowserSourceMaps: false,
  compress: true,
  reactStrictMode: true,
  
  // Configurações simples do webpack
  webpack: (config, { isServer }) => {
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