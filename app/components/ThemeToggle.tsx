"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Monitor, Moon, Sun } from "lucide-react";

type Choice = "light" | "dark" | "system";

const OPTIONS: { value: Choice; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

const HINTS: Record<Choice, string> = {
  light: "Bright, paper-like",
  dark: "Easy on the eyes at night",
  system: "Match your device",
};

function readChoice(): Choice {
  try {
    const v = localStorage.getItem("theme");
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function applyTheme(next: Choice) {
  const root = document.documentElement;
  const resolved = next === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : next;
  const apply = () => {
    root.dataset.theme = resolved;
    root.dataset.themeChoice = next;
    try {
      if (next === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", next);
    } catch {
      // storage blocked: the choice still applies for this page view
    }
  };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !document.startViewTransition) apply();
  else document.startViewTransition(apply);
}

// The trigger icon is pure CSS (keyed off <html data-theme>), so it never
// mismatches during hydration. Only the menu's checkmark needs React state.
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<Choice>("system");
  const wrap = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const items = () => Array.from(menu.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    (items().find((b) => b.getAttribute("aria-checked") === "true") ?? items()[0])?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        wrap.current?.querySelector<HTMLButtonElement>("button")?.focus();
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const list = items();
        const i = list.indexOf(document.activeElement as HTMLButtonElement);
        list[(i + (e.key === "ArrowDown" ? 1 : -1) + list.length) % list.length]?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (next: Choice) => {
    applyTheme(next);
    setChoice(next);
    setOpen(false);
  };

  return (
    <div ref={wrap} className={`theme-toggle relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          setChoice(readChoice()); // read on open: no effect, no hydration mismatch
          setOpen((o) => !o);
        }}
        aria-label="Theme"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Sun size={17} className="theme-i theme-i-light" />
        <Moon size={17} className="theme-i theme-i-dark" />
        <Monitor size={17} className="theme-i theme-i-system" />
        <span className="theme-label">
          <span className="theme-l theme-l-light">Light</span>
          <span className="theme-l theme-l-dark">Dark</span>
          <span className="theme-l theme-l-system">System</span>
        </span>
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul ref={menu} role="menu" aria-label="Appearance" className="theme-menu">
          <li role="presentation" className="theme-menu-head">Appearance</li>
          {OPTIONS.map(({ value, label, Icon }) => (
            <li key={value} role="none">
              <button type="button" role="menuitemradio" aria-checked={choice === value} onClick={() => pick(value)}>
                <Icon size={16} />
                <span className="theme-opt-text">
                  {label}
                  <small>{HINTS[value]}</small>
                </span>
                {choice === value && <Check size={15} className="theme-check" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
