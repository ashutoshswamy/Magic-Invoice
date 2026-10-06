"use client";

import { useRef } from "react";
import gsap from "gsap";
import { Moon, Sun } from "lucide-react";

// Which icon shows is pure CSS (keyed off <html data-theme>), so there is no
// theme state in React and nothing to mismatch during hydration.
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLButtonElement>(null);

  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const apply = () => {
      root.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch {
        // storage blocked: the choice still applies for this page view
      }
    };

    if (reduce || !document.startViewTransition) apply();
    else document.startViewTransition(apply);

    if (!reduce) {
      const icon = ref.current?.querySelector(next === "dark" ? ".theme-sun" : ".theme-moon");
      if (icon) gsap.fromTo(icon, { rotation: -90, scale: 0.5 }, { rotation: 0, scale: 1, duration: 0.45, ease: "back.out(2.4)" });
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={toggle}
      className={`theme-toggle nav-icon ${className}`}
      aria-label="Switch between light and dark theme"
      title="Switch theme"
    >
      <Moon size={17} className="theme-moon" />
      <Sun size={17} className="theme-sun" />
    </button>
  );
}
