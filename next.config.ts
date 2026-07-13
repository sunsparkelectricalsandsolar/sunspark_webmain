import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  experimental: {
    // Shared hosting has a strict process limit. Keep page-data collection to one worker.
    cpus: 1,
    workerThreads: true,
    // Images are limited to 2 MB each in the upload service. Allow a small gallery
    // to reach its Server Action without exposing an unnecessarily large payload.
    serverActions: {
      bodySizeLimit: "24mb"
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sunspark.co.ke"
      },
      {
        protocol: "https",
        hostname: "backend.sunsparkelectricals.co.ke"
      },
      {
        protocol: "http",
        hostname: "localhost"
      }
    ]
  },
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@": path.resolve(__dirname)
    };
    return config;
  }
};

export default nextConfig;
