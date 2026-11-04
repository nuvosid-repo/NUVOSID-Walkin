import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    // Cover images go through a Server Action. 3D models use their own route handler.
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
