import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Images are limited to 2 MB each in the upload service. Allow a small gallery
    // to reach its Server Action without exposing an unnecessarily large payload.
    serverActions: {
      bodySizeLimit: "12mb"
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sunspark.co.ke"
      }
    ]
  }
};

export default nextConfig;
