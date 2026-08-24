import type { Metadata } from "next";
import Script from "next/script";
import { Playfair_Display, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://magicinvoice.in"),
  title: {
    default: "Magic Invoice | AI-Powered Invoicing Workspace",
    template: "%s | Magic Invoice",
  },
  description:
    "Turn natural language descriptions into professional, GST-compliant invoices instantly. The ultimate AI-assisted invoicing tool for freelancers and small businesses.",
  applicationName: "Magic Invoice",
  keywords: [
    "Magic Invoice",
    "AI invoice generator",
    "natural language invoicing",
    "GST invoice builder India",
    "freelancer billing workspace",
    "automated invoice parser",
    "free invoicing software",
    "revenue tracking dashboard",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://magicinvoice.in/",
    title: "Magic Invoice | AI-Powered Invoicing Workspace",
    description:
      "Turn natural language descriptions into professional, GST-compliant invoices instantly. The ultimate AI-assisted invoicing tool for freelancers and small businesses.",
    siteName: "Magic Invoice",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Magic Invoice - AI Invoicing Workspace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Magic Invoice | AI-Powered Invoicing Workspace",
    description:
      "Turn natural language descriptions into professional, GST-compliant invoices instantly. The ultimate AI-assisted invoicing tool for freelancers and small businesses.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/site.webmanifest",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Magic Invoice",
  "url": "https://magicinvoice.in",
  "description": "Turn natural language descriptions into professional, GST-compliant invoices instantly. The ultimate AI-assisted invoicing tool for freelancers and small businesses.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "All",
  "browserRequirements": "Requires JavaScript. Requires HTML5.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "INR"
  },
  "featureList": [
    "AI-Powered Invoice Generation from Natural Language",
    "GST/CGST/SGST/IGST Automatic Calculation",
    "HSN/SAC Code Auto-completion",
    "Client and Service Directory Management",
    "Live Revenue Analytics & Reports",
    "Razorpay payment links integration"
  ]
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${dmSans.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-0EKX8DX76G"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-0EKX8DX76G');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
