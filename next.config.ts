import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['cesium'],
  
  // Add this empty turbopack config
  turbopack: {},
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        http: false,
        https: false,
        zlib: false,
        url: false,
      };
    }
    return config;
  },
};

export default nextConfig;