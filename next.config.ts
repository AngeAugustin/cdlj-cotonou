import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.61'],
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/branding/favicon-48.png",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
