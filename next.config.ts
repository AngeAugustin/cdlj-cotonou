import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * CSP resserrée : origines explicites (plus de https: / wss: wildcards).
 * 'unsafe-inline' reste nécessaire pour Next.js (scripts/styles injectés).
 * 'unsafe-eval' uniquement en développement (HMR / React Refresh).
 */
function buildCsp(): string {
  const scriptSrc = ["'self'", "'unsafe-inline'"];
  if (!isProd) scriptSrc.push("'unsafe-eval'");

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    [
      "img-src 'self' data: blob:",
      "https://i.postimg.cc",
      "https://images.unsplash.com",
      "https://*.public.blob.vercel-storage.com",
      "https://*.tile.openstreetmap.org",
      "https://tile.openstreetmap.org",
    ].join(" "),
    "font-src 'self' data:",
    [
      "connect-src 'self'",
      "https://*.public.blob.vercel-storage.com",
      // Dev : HMR / turbopack
      ...(isProd ? [] : ["ws:", "wss:"]),
    ].join(" "),
    "media-src 'self' blob: https://*.public.blob.vercel-storage.com",
    "worker-src 'self' blob:",
    "frame-src 'self' https://www.openstreetmap.org",
    "manifest-src 'self'",
  ];

  if (isProd) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy", value: buildCsp() },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.61"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.postimg.cc", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "/**" },
      { protocol: "https", hostname: "public.blob.vercel-storage.com", pathname: "/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
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
