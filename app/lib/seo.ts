import type { Metadata } from "next";

export const SITE_URL = "https://magicinvoice.in";
const OG_IMAGE = { url: "/og-image.jpg", width: 1200, height: 630, alt: "Magic Invoice: type the job, get a GST invoice" };

// Per-page metadata for public pages. Open Graph and Twitter objects replace
// (not merge with) the parent's, so title, URL and image are set together here.
export function pageMetadata({ path, title, description }: { path: string; title: string; description: string }): Metadata {
  const shareTitle = path === "/" ? title : `${title} | Magic Invoice`;
  return {
    title: path === "/" ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName: "Magic Invoice",
      url: path,
      title: shareTitle,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      creator: "@ashutoshswamy_",
      title: shareTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

// For signed-in app screens: a tab title, kept out of search results.
export const privateMetadata = (title: string): Metadata => ({
  title,
  robots: { index: false, follow: false },
});
