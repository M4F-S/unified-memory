/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  distDir: 'dist',
  images: { unoptimized: true },
  swcMinify: false,
};
module.exports = nextConfig;
