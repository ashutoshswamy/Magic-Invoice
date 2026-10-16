"use client";

import { useEffect } from "react";

const ID = "G-GFLEERSHLH";
const KEY = "magic-invoice-cookie-consent";

export default function Analytics() {
  useEffect(() => {
    if (localStorage.getItem(KEY) !== "accepted") return;
    const add = () => {
      if (document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) return;
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${ID}`;
      document.head.appendChild(script);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(["js", new Date()]);
      window.dataLayer.push(["config", ID]);
    };
    add();
    const onConsent = (event: Event) => { if ((event as CustomEvent).detail === "accepted") add(); };
    window.addEventListener("magic-invoice:cookie-consent", onConsent);
    return () => window.removeEventListener("magic-invoice:cookie-consent", onConsent);
  }, []);
  return null;
}

declare global {
  interface Window { dataLayer?: unknown[] }
}
