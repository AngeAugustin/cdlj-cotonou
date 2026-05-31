import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.61'],
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/icon.png",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
