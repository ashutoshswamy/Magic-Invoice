"use client";

import { useRef, type HTMLAttributes } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

type Props = HTMLAttributes<HTMLElement> & {
  as?: "div" | "tr";
  vars?: gsap.TweenVars;
};

// Entrance on mount for elements that appear after the page template has run
// (async lists, toggled panels). template.tsx skips anything under [data-reveal].
// ponytail: mount-only, no exit animation; unmounts are instant.
export default function Reveal({ as = "div", vars, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(ref.current, {
        autoAlpha: 0,
        y: 10,
        duration: 0.45,
        ease: "power2.out",
        // opacity/width stay inline so React-driven values (e.g. paused 0.55) survive
        clearProps: "transform,visibility",
        ...vars,
      });
    });
    return () => mm.revert();
  });

  const Tag = as as "div";
  return <Tag ref={ref as React.RefObject<HTMLDivElement>} data-reveal="" {...rest} />;
}
