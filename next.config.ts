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
    // Cover images go through a Server Action. 3D models are uploaded in chunks by their own route.
    serverActions: { bodySizeLimit: "4.4mb" },
  },
};

export default nextConfig;
