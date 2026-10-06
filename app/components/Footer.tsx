"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../lib/useAuth";
import { Logo } from "./TopNav";

const contact = [
  { href: "mailto:ashutoshswamy397@gmail.com", label: "Email" },
  { href: "https://github.com/ashutoshswamy", label: "GitHub" },
  { href: "https://linkedin.com/in/ashutoshswamy", label: "LinkedIn" },
  { href: "https://twitter.com/ashutoshswamy_", label: "X (Twitter)" },
];

const legal = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookies" },
];

export default function Footer() {
  const { isSignedIn } = useAuth();
  const product = [
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/#security", label: "Security" },
    ...(isSignedIn
      ? [
          { href: "/invoices", label: "Invoices" },
          { href: "/clients", label: "Clients" },
          { href: "/settings", label: "Settings" },
        ]
      : [
          { href: "/login", label: "Sign in" },
          { href: "/signup", label: "Create account" },
        ]),
  ];

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Logo />
          <p>AI invoicing for Indian freelancers and small businesses. GST worked out for you.</p>
          <a
            href="https://www.producthunt.com/products/magic-invoice-2?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-magic-invoice-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1065115&theme=light&t=1768842848845"
              alt="Magic Invoice on Product Hunt"
              width={200}
              height={44}
              unoptimized
            />
          </a>
        </div>

        <nav aria-label="Product">
          <h2>Product</h2>
          {product.map((l) => (
            <Link key={l.href} href={l.href}>{l.label}</Link>
          ))}
        </nav>

        <nav aria-label="Contact">
          <h2>Contact</h2>
          {contact.map((l) => {
            const external = !l.href.startsWith("mailto");
            return (
              <a
                key={l.href}
                href={l.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
              >
                {l.label}
              </a>
            );
          })}
        </nav>
      </div>

      <div className="footer-base">
        <span>© {new Date().getFullYear()} Magic Invoice</span>
        <div>
          {legal.map((l) => (
            <Link key={l.href} href={l.href}>{l.label}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
