"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../lib/firebaseClient";
import { useAuth } from "../lib/useAuth";
import TopNav from "./TopNav";
import HeroDemo from "./HeroDemo";
import { Eye, EyeOff } from "lucide-react";

// Official multicolour Google "G" mark (required by Google's sign-in branding guidelines).
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  minLength,
  hint,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  minLength?: number;
  hint?: string;
  error?: string | null;
}) {
  const [visible, setVisible] = useState(false);
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={minLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="auth-input !pr-11"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-[var(--radius)] text-ink-3 transition-colors hover:text-ink"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {hint && <p id={`${id}-hint`} className="text-xs text-ink-3">{hint}</p>}
      {error && <p id={`${id}-error`} className="text-xs text-[var(--bad)]">{error}</p>}
    </div>
  );
}

const copy = {
  login: {
    title: "Sign in to Magic Invoice",
    sub: "Pick up where you left off.",
    submit: "Sign in",
    busy: "Signing in...",
    google: "Continue with Google",
    error: "Invalid email or password.",
    googleError: "Google sign-in failed. Try again or use email.",
    passwordHint: undefined,
    switchText: "No account yet?",
    switchHref: "/signup",
    switchLabel: "Create account",
  },
  signup: {
    title: "Create your account",
    sub: "Free, with every feature. No card needed.",
    submit: "Create account",
    busy: "Creating account...",
    google: "Continue with Google",
    error: "Could not create the account. Try a different email or a stronger password.",
    googleError: "Google sign-up failed. Try again or use email.",
    passwordHint: "At least 6 characters.",
    switchText: "Already have an account?",
    switchHref: "/login",
    switchLabel: "Sign in",
  },
} as const;

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const t = copy[mode];
  const router = useRouter();
  const { user, isLoaded } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Single path to the dashboard: whenever Firebase reports a signed-in user
  // (fresh sign-in or a persisted one), mint the server session cookie first.
  // proxy.ts guards app routes on that cookie, so navigating without it
  // bounces straight back here and loops.
  useEffect(() => {
    if (!isLoaded || !user) return;
    let cancelled = false;
    (async () => {
      setIsSubmitting(true);
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: await user.getIdToken() }),
      }).catch(() => null);
      if (cancelled) return;
      if (res?.ok) {
        router.replace("/dashboard");
        router.refresh();
      } else {
        setError("You are signed in, but the server could not start your session. Try again in a moment.");
        setIsSubmitting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user, router]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "signup" && password !== confirm) {
      setConfirmError("Passwords do not match.");
      return;
    }
    setConfirmError(null);
    setIsSubmitting(true);
    try {
      if (mode === "login") await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
      // the effect above takes it from here
    } catch {
      setError(t.error);
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch {
      setError(t.googleError);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <TopNav />
      <main className="mx-auto grid max-w-[1240px] items-center gap-16 px-4 py-12 sm:px-6 lg:min-h-[calc(100dvh-64px)] lg:grid-cols-[minmax(0,420px)_1fr] lg:py-8">
        <div className="mx-auto w-full max-w-[420px] lg:mx-0">
          <h1 className="font-head text-[clamp(28px,4vw,38px)] font-bold leading-[1.08]">{t.title}</h1>
          <p className="mt-2 text-ink-2">{t.sub}</p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={isSubmitting}
            className="btn-ghost mt-8 w-full !py-3.5"
          >
            <GoogleMark />
            {t.google}
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-ink-3" aria-hidden>
            <span className="h-px flex-1 bg-line-strong" /> or with email <span className="h-px flex-1 bg-line-strong" />
          </div>

          <form onSubmit={handleEmail} className="grid gap-5" >
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="auth-input"
              />
            </div>
            <PasswordField
              id="password"
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={mode === "signup" ? 6 : undefined}
              hint={t.passwordHint}
            />
            {mode === "signup" && (
              <PasswordField
                id="confirm-password"
                label="Confirm password"
                value={confirm}
                onChange={(v) => {
                  setConfirm(v);
                  if (confirmError && v === password) setConfirmError(null);
                }}
                autoComplete="new-password"
                error={confirmError}
              />
            )}
            {error && (
              <p role="alert" className="text-sm text-[var(--bad)]">{error}</p>
            )}
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full !py-3.5">
              {isSubmitting ? t.busy : t.submit}
            </button>
          </form>

          <p className="mt-6 text-sm text-ink-2">
            {t.switchText}{" "}
            <Link href={t.switchHref} className="font-medium text-accent underline-offset-4 hover:underline">
              {t.switchLabel}
            </Link>
          </p>
        </div>

        <div className="hidden justify-self-center lg:block">
          <HeroDemo delay={0.4} />
        </div>
      </main>
    </div>
  );
}
