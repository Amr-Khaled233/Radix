import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

// This project's Blob store when its token is set at build time (Vercel), otherwise any store.
const blobStoreId = process.env.BLOB_READ_WRITE_TOKEN?.match(/^vercel_blob_rw_([a-z0-9]+)_/i)?.[1]?.toLowerCase();
const BLOB_HOST = blobStoreId ? `${blobStoreId}.public.blob.vercel-storage.com` : "*.public.blob.vercel-storage.com";
const BLOB = `https://${BLOB_HOST}`;

/**
 * Static pages can't carry per-request nonces, so scripts allow 'unsafe-inline'
 * (Next.js bootstraps inline). Everything else is locked to this origin, Vercel
 * Blob and Vercel's analytics endpoints.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${BLOB}`,
  `media-src 'self' blob: ${BLOB}`,
  "font-src 'self'",
  `connect-src 'self' ${BLOB} https://*.blob.vercel-storage.com https://vercel.com https://vitals.vercel-insights.com https://va.vercel-scripts.com`,
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Inline the (small) stylesheet so first paint doesn't wait for a CSS request.
    inlineCss: true,
  },
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: BLOB_HOST }],
    // Development uploads stored on disk (see lib/media/storage.ts).
    localPatterns: [{ pathname: "/api/media/local/**" }, { pathname: "/brand/**" }, { pathname: "/icons/**" }],
  },
  // The Work index was removed: case studies live under their pillar (/services/{pillar}/{project}).
  async redirects() {
    return [
      { source: "/:locale(en|ar)/work", destination: "/:locale/services", permanent: true },
      { source: "/:locale(en|ar)/work/:path*", destination: "/:locale/services", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
