import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const page = (path: string, changeFrequency: "weekly" | "monthly" | "yearly", priority: number) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  });

  return [
    page("/", "weekly", 1),
    page("/signup", "monthly", 0.6),
    page("/privacy", "yearly", 0.3),
    page("/terms", "yearly", 0.3),
    page("/cookies", "yearly", 0.3),
  ];
}
