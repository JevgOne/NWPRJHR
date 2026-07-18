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
      {
        source: "/offer/kategorie/premium",
        destination: "/offer/kategorie/luxe",
        permanent: true,
      },
      {
        source: "/ua/offer/kategorie/premium",
        destination: "/ua/offer/kategorie/luxe",
        permanent: true,
      },
      {
        source: "/rus/offer/kategorie/premium",
        destination: "/rus/offer/kategorie/luxe",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
