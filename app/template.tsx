"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Re-mounts on every navigation, so each page gets one entrance:
// headings and first-level surfaces settle in, top to bottom.
// ponytail: only animates what is in the DOM at mount; data that loads later just appears.
export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useGSAP(
    () => {
      if (pathname === "/") return; // landing runs its own choreography
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const targets = gsap.utils
          .toArray<HTMLElement>("h1, .section-label, .card, .glass-panel, form", ref.current)
          .filter((el) => !el.closest("header, [data-reveal]"))
          .slice(0, 14);
        gsap.from(targets, {
          autoAlpha: 0,
          y: 14,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.04,
          clearProps: "transform,opacity,visibility",
        });
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [pathname] },
  );

  return <div ref={ref}>{children}</div>;
}
