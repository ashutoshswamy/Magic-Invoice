import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/seo";

// Signed-in screens also send noindex (privateMetadata); blocking them here
// just saves crawl budget, since they redirect to /login for crawlers anyway.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/analytics",
          "/billing",
          "/clients",
          "/dashboard",
          "/expenses",
          "/gstr",
          "/invoices",
          "/items",
          "/login",
          "/profile",
          "/recurring",
          "/settings",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
