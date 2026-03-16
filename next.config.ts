import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack (next dev / next build sur Next.js 16)
  turbopack: {
    resolveAlias: {
      canvas: './empty-module.js',
    },
  },
  // Webpack (fallback pour les builds qui n'utilisent pas Turbopack)
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
