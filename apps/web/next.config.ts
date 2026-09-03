import type { NextConfig } from "next";

const BACKEND_URL =
  process.env.BACKEND_API_URL ?? "https://tipchain-backend.vercel.app";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
