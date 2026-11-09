import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "./lib/seo";
import Analytics from "./components/Analytics";
import CookieConsent from "./components/CookieConsent";
import ToastProvider from "./components/ToastProvider";

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], display: "swap" });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], display: "swap" });

// Site-wide defaults. Public pages set their own canonical/Open Graph via
// pageMetadata() in lib/seo.ts; app screens use privateMetadata() (noindex).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Magic Invoice | AI GST Invoice Generator for India",
    template: "%s | Magic Invoice",
  },
  description:
    "Type one sentence and get a GST invoice with line items, SAC codes and the CGST, SGST or IGST split worked out. Free for Indian freelancers and small businesses.",
  applicationName: "Magic Invoice",
  authors: [{ name: "Ashutosh Swamy", url: "https://ashutoshswamy.in" }],
  creator: "Ashutosh Swamy",
  category: "business",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Magic Invoice",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", creator: "@ashutoshswamy_", images: ["/og-image.jpg"] },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  // iOS would otherwise turn GSTINs and amounts into tappable phone links.
  formatDetection: { telephone: false },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2ee" },
    { media: "(prefers-color-scheme: dark)", color: "#14110e" },
  ],
};

const webApp = {
  "@type": "WebApplication",
  name: "Magic Invoice",
  url: SITE_URL,
  description:
    "AI invoice generator for India. Type one sentence and get a GST invoice with line items, SAC codes and the CGST, SGST or IGST split worked out.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript.",
  inLanguage: "en-IN",
  isAccessibleForFree: true,
  author: { "@type": "Person", name: "Ashutosh Swamy", url: "https://ashutoshswamy.in" },
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  featureList: [
    "Invoice drafting from a plain-language sentence",
    "Automatic CGST, SGST and IGST split",
    "HSN and SAC codes inferred by AI",
    "GSTR-1 export and GSTR-3B summary",
    "Expense and input tax credit tracking",
    "Recurring invoice templates",
    "Razorpay payment links",
    "Revenue analytics and cash flow insights",
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    webApp,
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: "Magic Invoice",
      url: SITE_URL,
      logo: `${SITE_URL}/android-chrome-512x512.png`,
      sameAs: ["https://github.com/ashutoshswamy", "https://twitter.com/ashutoshswamy_", "https://linkedin.com/in/ashutoshswamy"],
    },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "Magic Invoice", url: SITE_URL, inLanguage: "en-IN" },
  ],
};

const themeScript = `(function(){var d=document.documentElement,m=matchMedia("(prefers-color-scheme: dark)");function s(){try{return localStorage.getItem("theme")}catch(e){return null}}function a(){d.dataset.theme=s()||(m.matches?"dark":"light");d.dataset.themeChoice=s()||"system"}a();m.addEventListener("change",function(){if(!s())a()})})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-IN"
      className={`${bricolage.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before paint: stored theme, else system preference; follows
            system changes until the user picks one with the toggle. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ToastProvider><Analytics />{children}<CookieConsent /></ToastProvider>
      </body>
    </html>
  );
}
