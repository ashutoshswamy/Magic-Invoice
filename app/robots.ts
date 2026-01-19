import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/analytics",
          "/clients",
          "/dashboard",
          "/invoices",
          "/login",
          "/profile",
          "/settings",
          "/signup",
        ],
      },
    ],
    sitemap: "https://magicinvoice.in/sitemap.xml",
  };
}
