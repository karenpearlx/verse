import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      // Next.js + Google Fonts CSS; keep inline styles for existing CSS variables.
      "style-src 'self' 'unsafe-inline'",
      // Next requires inline/eval in some runtimes; tighten later if nonces land.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.anthropic.com https://api.paymongo.com",
      // Course pages embed YouTube lessons (privacy-enhanced player only).
      "frame-src 'self' https://www.youtube-nocookie.com",
      "worker-src 'self'",
      "manifest-src 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["flatly-sensually-staid-redstart.kitten.space"],
  experimental: {
    optimizePackageImports: ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"],
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
    // These niche tracks were replaced by the longer written versions.
    return [
      { source: "/courses/seo-for-vas", destination: "/courses/seo-specialist", permanent: true },
      {
        source: "/courses/social-media-management",
        destination: "/courses/social-media-manager",
        permanent: true,
      },
      {
        source: "/courses/ecommerce-operations",
        destination: "/courses/ecommerce-va",
        permanent: true,
      },
      {
        source: "/courses/operations-lead",
        destination: "/courses/becoming-an-ops-lead",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
