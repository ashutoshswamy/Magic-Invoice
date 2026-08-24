"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebaseClient";
import { useAuth } from "../lib/useAuth";
import TopNav from "../components/TopNav";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoaded } = useAuth();

  const handleSignOut = async () => {
    await signOut(auth);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <TopNav />
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 64px", display: "flex", flexDirection: "column", gap: 32 }}>
        <div>
          <p className="section-label" style={{ marginBottom: 10 }}>Account</p>
          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontWeight: 600, fontSize: "clamp(24px, 4vw, 36px)", color: "var(--text-primary)", margin: 0 }}>
            Your profile
          </h1>
        </div>
        <motion.div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)" }}>Email</span>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-primary)" }}>
              {isLoaded ? user?.email ?? "—" : "Loading..."}
            </p>
          </div>
          <button onClick={handleSignOut} className="btn-gold" style={{ alignSelf: "flex-start" }}>
            Sign out
          </button>
        </motion.div>
      </div>
    </div>
  );
}
