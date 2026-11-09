import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/seo";
import { GUIDES } from "./lib/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  // ponytail: bump by hand when a page's content changes; new Date() would claim everything changed on every build.
  const lastModified = new Date("2026-11-10");
  const page = (path: string, changeFrequency: "weekly" | "monthly" | "yearly", priority: number) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  });

  return [
    page("/", "weekly", 1),
    ...GUIDES.map((g) => page(`/${g.slug}`, "monthly", 0.8)),
    page("/signup", "monthly", 0.6),
    page("/privacy", "yearly", 0.3),
    page("/terms", "yearly", 0.3),
    page("/cookies", "yearly", 0.3),
  ];
}
