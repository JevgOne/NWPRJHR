import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const adminDisallow = [
    "/api/",
    "/dashboard",
    "/inventory",
    "/products",
    "/orders",
    "/salons",
    "/invoices",
    "/sales",
    "/customers",
    "/export",
    "/complaints",
    "/settings",
    "/notifications",
    "/audit-log",
    "/referrals",
    "/promo-codes",
    "/posts",
    "/reviews",
    "/returns",
    "/payments",
    "/registrations",
    "/samples",
    "/discounts",
    "/finance",
    "/inquiries",
    "/stylists",
    "/suppliers",
    "/salon",
    "/reservations",
    "/calendar",
    "/order-products",
    "/messages",
  ];

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: adminDisallow,
    },
    sitemap: "https://www.hairland.cz/sitemap.xml",
  };
}
