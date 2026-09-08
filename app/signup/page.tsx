"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../lib/firebaseClient";
import { useAuth } from "../lib/useAuth";
import TopNav from "../components/TopNav";

const fieldBox = { background: "var(--ink-soft)", border: "1px solid var(--border)", borderRadius: 2, padding: "12px 16px", display: "flex", flexDirection: "column" as const, gap: 6, width: "100%" };
const fieldLabel = { fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "var(--text-muted)" };
const fieldInput = { background: "transparent", border: "none", outline: "none", color: "var(--text-primary)", fontSize: 13, width: "100%", padding: 0 };

export default function SignupPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace("/dashboard");
  }, [isLoaded, isSignedIn, router]);

  const establishSession = async (idToken: string) => {
    // Session cookie is best-effort; client auth state already gates the app.
    try {
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
    } catch {
      // ignore — redirect regardless
    }
    router.replace("/dashboard");
    router.refresh();
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await establishSession(await credential.user.getIdToken());
    } catch {
      setError("Could not create account. Try a different email or a stronger password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      await establishSession(await credential.user.getIdToken());
    } catch {
      setError("Google sign-up failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <TopNav />
      <div
        style={{
          maxWidth: 420,
          margin: "0 auto",
          padding: "64px 24px 80px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p className="section-label" style={{ marginBottom: 12 }}>Free during launch</p>
          <h1
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontWeight: 600,
              fontSize: "clamp(24px, 5vw, 36px)",
              color: "var(--text-primary)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Create your account
          </h1>
        </div>

        <form onSubmit={handleEmailSignUp} className="card" style={{ padding: 28, width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={fieldBox}>
            <span style={fieldLabel}>Email</span>
            <input style={fieldInput} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
          </div>
          <div style={fieldBox}>
            <span style={fieldLabel}>Password</span>
            <input style={fieldInput} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} />
          </div>
          {error && <span style={{ fontSize: 11, color: "#e5484d", fontFamily: "var(--font-mono), monospace" }}>{error}</span>}
          <button type="submit" disabled={isSubmitting} className="btn-gold">
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <button
          onClick={handleGoogleSignUp}
          disabled={isSubmitting}
          className="card"
          style={{ width: "100%", padding: "12px 16px", fontSize: 13, color: "var(--text-primary)", cursor: "pointer" }}
        >
          Sign up with Google
        </button>

        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Already have an account? <a href="/login" style={{ color: "var(--gold)" }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
