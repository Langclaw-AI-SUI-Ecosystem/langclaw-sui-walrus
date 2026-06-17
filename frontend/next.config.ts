import type { NextConfig } from "next";

const backendRewriteDestination = (
  process.env.LANGCLAW_BACKEND_REWRITE_URL || "http://127.0.0.1:3002"
).replace(/\/+$/, "");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' http://localhost:3001 https: wss:",
      "frame-src 'self' https:",
      "worker-src 'self' blob:",
    ].join("; "),
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["langclawcelo.vercel.app"],
  devIndicators: false,
  async headers() {
    return [
      {
        headers: securityHeaders,
        source: "/(.*)",
      },
    ];
  },
  async rewrites() {
    return [
      {
        destination: `${backendRewriteDestination}/:path*`,
        source: "/api/backend/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        hostname: "zwagiicvlhayuknccnhc.supabase.co",
        pathname: "/storage/v1/object/public/image/**",
        protocol: "https",
      },
    ],
  },
  poweredByHeader: false,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
