import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // firebase-admin pulls jwks-rsa -> require('jose'), jose v5 is ESM-only.
  // Keep it external so Node loads it instead of the bundler.
  serverExternalPackages: ["firebase-admin"],
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://www.googletagmanager.com https://apis.google.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://*.googleapis.com https://securetoken.googleapis.com https://generativelanguage.googleapis.com https://challenges.cloudflare.com https://www.google-analytics.com https://analytics.google.com https://www.google.com",
            "worker-src 'self' blob:",
            "frame-src 'self' https://*.firebaseapp.com https://challenges.cloudflare.com https://accounts.google.com",
          ].join("; "),
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ],
    },
  ],
};

export default nextConfig;
