import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
