/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== "production";

// Tavus Conversational Video runs inside a Daily.co room (the returned
// conversation_url). We allow only self + Tavus/Daily frame sources, Unsplash
// images, and self-hosted fonts (next/font bundles them at our own origin).
const contentSecurityPolicy = [
  "default-src 'self'",
  // Next injects a small inline bootstrap; dev also needs eval for React Refresh.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://images.unsplash.com",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "frame-src https://*.daily.co https://*.tavus.io https://tavusapi.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    // Camera + microphone only for self and the Tavus video frame.
    key: "Permissions-Policy",
    value:
      'camera=(self "https://tavus.daily.co"), microphone=(self "https://tavus.daily.co"), geolocation=(), payment=(), usb=()',
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
