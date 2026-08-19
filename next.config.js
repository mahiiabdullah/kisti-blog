/** @type {import('next').NextConfig} */

const securityHeaders = [
  // ── Content-Security-Policy (ENFORCED) ──
  // Whitelisted: Google Fonts, Cloudflare Insights, Supabase
  // NOTE: unsafe-inline is required by Next.js App Router for hydration scripts.
  // To remove it, implement CSP nonces via middleware.ts (a separate task).
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js requires unsafe-inline/unsafe-eval; Cloudflare Insights script allowed
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com",
      // Google Fonts stylesheet allowed
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Remote images via Supabase and any https source
      "img-src 'self' data: https:",
      // Google Fonts actual font files + data URIs
      "font-src 'self' data: https://fonts.gstatic.com",
      // Supabase REST + Realtime WebSocket + Cloudflare beacon
      "connect-src 'self' https://gvallvncqtvlfubrnver.supabase.co wss://gvallvncqtvlfubrnver.supabase.co https://static.cloudflareinsights.com",
      // Explicitly block Flash, plugins, and <object>/<embed> elements
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  // ── Clickjacking protection (redundant with frame-ancestors but belt-and-braces) ──
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // ── Prevent MIME-type sniffing ──
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // ── Control referrer information sent to third parties ──
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // ── Force HTTPS for 1 year (Cloudflare already does this, but belt-and-braces) ──
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // ── Disable unused browser APIs ──
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gvallvncqtvlfubrnver.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async headers() {
    return [
      {
        // Apply to every route — pages, API routes, static files
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
