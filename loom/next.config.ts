import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  turbopack: {
    rules: {
      // Disable source maps in development
      '*.{js,jsx,ts,tsx}': {
        sourceMap: false,
      },
    },
  },
};

export default nextConfig;