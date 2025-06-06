import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
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