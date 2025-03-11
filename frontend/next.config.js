/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  reactStrictMode: false,
  swcMinify: false,
  optimizeFonts: false,
  productionBrowserSourceMaps: true,
}

module.exports = nextConfig
