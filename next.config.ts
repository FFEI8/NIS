import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  output: 'standalone',
  allowedDevOrigins: [
    '127.0.0.1',
    'localhost',
    '.space-z.ai',
  ],
};

export default nextConfig;
