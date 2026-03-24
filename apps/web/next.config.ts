import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@mmpi2/ui', '@mmpi2/contracts'],
};

export default nextConfig;
