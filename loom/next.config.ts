import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  images: {
    domains: ['lh3.googleusercontent.com'],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
        port: "",
        pathname: "/**",
      },
    ],
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