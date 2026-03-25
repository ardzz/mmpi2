import type { NextConfig } from 'next';

const isWindows = process.platform === 'win32';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isWindows ? {} : { output: 'standalone' }),
  transpilePackages: ['@mmpi2/ui', '@mmpi2/contracts'],
};

export default nextConfig;
