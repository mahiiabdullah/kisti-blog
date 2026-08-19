/** @type {import('next').NextConfig} */

const securityHeaders = [
  // ── Content-Security-Policy (Report-Only so it never breaks the site) ──
  // Switch key to 'Content-Security-Policy' when you're happy with the reports.
  {
    key: 'Content-Security-Policy-Report-Only',
    value: [
      "default-src 'self'",
      // 'unsafe-inline' needed for Next.js inline scripts; 'unsafe-eval' for
      // dynamic imports. Remove these incrementally once you add nonces/hashes.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      // data: for base64 images; https: for all remote images (Supabase, etc.)
      "img-src 'self' data: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://gvallvncqtvlfubrnver.supabase.co wss://gvallvncqtvlfubrnver.supabase.co",
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
