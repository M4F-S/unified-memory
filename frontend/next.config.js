/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  distDir: ".next",
  images: { unoptimized: true },
  swcMinify: false,
};
module.exports = nextConfig;
