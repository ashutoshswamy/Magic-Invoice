"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

const KEY = "magic-invoice-cookie-consent";

export default function CookieConsent() {
  const visible = useSyncExternalStore(
    (onChange) => { window.addEventListener("magic-invoice:cookie-consent", onChange); return () => window.removeEventListener("magic-invoice:cookie-consent", onChange); },
    () => !localStorage.getItem(KEY),
    () => false,
  );
  if (!visible) return null;
  const choose = (value: "accepted" | "declined") => {
    localStorage.setItem(KEY, value);
    window.dispatchEvent(new CustomEvent("magic-invoice:cookie-consent", { detail: value }));
  };
  return (
    <aside className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <div><strong>Cookies</strong><p>Essential cookies keep sign-in and security working. Optional analytics cookies help improve Magic Invoice. <Link href="/cookies">Learn more</Link>.</p></div>
      <div className="cookie-actions"><button className="btn-ghost" onClick={() => choose("declined")}>Decline</button><button className="btn-primary" onClick={() => choose("accepted")}>Accept analytics</button></div>
    </aside>
  );
}
