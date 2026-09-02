import type { NextConfig } from "next";

/**
 * Origin of the Codex backend. Overridable via the BACKEND_ORIGIN env var
 * (see .env.example). Read at server start / build time.
 */
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:8000";

const backend = new URL(BACKEND_ORIGIN);

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_ORIGIN}/api/v1/:path*`,
      },
    ];
  },
  images: {
    // Mock media (and future backend uploads) include SVG placeholders.
    // Scripts are neutralized via CSP + sandbox.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: backend.protocol.slice(0, -1) as "http" | "https",
        hostname: backend.hostname,
        ...(backend.port ? { port: backend.port } : {}),
      },
    ],
  },
};

export default nextConfig;
