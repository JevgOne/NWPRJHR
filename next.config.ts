import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  devIndicators: false,
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/**": ["./public/fonts/**", "./public/logo-invoice.png"],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { hostname: "randomuser.me" },
      { hostname: "usxv0mh0wvr3gzdk.public.blob.vercel-storage.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net https://www.gstatic.com https://apis.google.com https://c.seznam.cz https://www.heureka.cz https://widget.packeta.com https://analytics.ahrefs.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://graph.facebook.com https://www.facebook.com https://connect.facebook.net https://widget.packeta.com https://api.packeta.com https://*.zbozi.cz https://*.heureka.cz https://*.seznam.cz https://analytics.ahrefs.com",
              "frame-src 'self' https://payments.comgate.cz https://widget.packeta.com https://www.google.com https://www.facebook.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/advice",
        destination: "/poradna",
        permanent: true,
      },
      {
        source: "/cooperation",
        destination: "/pro",
        permanent: true,
      },
      {
        source: "/kontakt",
        destination: "/contact",
        permanent: true,
      },
      // 301: /offer → /vlasy-k-prodlouzeni (catch-all for old URLs)
      {
        source: "/offer",
        destination: "/vlasy-k-prodlouzeni",
        permanent: true,
      },
      {
        source: "/offer/:path*",
        destination: "/vlasy-k-prodlouzeni/:path*",
        permanent: true,
      },
      {
        source: "/offer/kategorie/premium",
        destination: "/vlasy-k-prodlouzeni/kategorie/luxe",
        permanent: true,
      },
      {
        source: "/ua/offer/kategorie/premium",
        destination: "/ua/vlasy-k-prodlouzeni/kategorie/luxe",
        permanent: true,
      },
      {
        source: "/rus/offer/kategorie/premium",
        destination: "/rus/vlasy-k-prodlouzeni/kategorie/luxe",
        permanent: true,
      },
      // Legacy URL redirects
      {
        source: "/vlasy/virgin",
        destination: "/vlasy-k-prodlouzeni?category=VIRGIN",
        permanent: true,
      },
      {
        source: "/vlasy/luxe",
        destination: "/vlasy-k-prodlouzeni?category=LUXE",
        permanent: true,
      },
      {
        source: "/vlasy/:slug",
        destination: "/vlasy-k-prodlouzeni",
        permanent: false,
      },
      {
        source: "/vlasy",
        destination: "/vlasy-k-prodlouzeni",
        permanent: true,
      },
      {
        source: "/o-nas",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/faq",
        destination: "/poradna",
        permanent: false,
      },
      {
        source: "/register",
        destination: "/registrace",
        permanent: true,
      },
      {
        source: "/stock",
        destination: "/inventory",
        permanent: true,
      },
      {
        source: "/vykup-vlasu",
        destination: "/vykup",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
