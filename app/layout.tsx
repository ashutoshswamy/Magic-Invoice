import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
  alternates: {
    canonical: "/",
  },
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-50`}
      >
        {children}
      </body>
    </html>
  );
}
