import type { Metadata } from "next";
import Script from "next/script";
import { Playfair_Display, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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
    default: "Magic Invoice",
    template: "%s | Magic Invoice",
  },
  description:
    "Turn natural language into professional invoices with AI-assisted parsing.",
  applicationName: "Magic Invoice",
  keywords: [
    "Magic Invoice",
    "AI invoice",
    "invoice generator",
    "freelancer invoices",
    "small business invoicing",
    "client-ready invoices",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://magicinvoice.in/",
    title: "Magic Invoice",
    description:
      "Turn natural language into professional invoices with AI-assisted parsing.",
    siteName: "Magic Invoice",
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${playfair.variable} ${dmSans.variable} ${ibmPlexMono.variable} antialiased`}
        >
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
    </ClerkProvider>
  );
}
