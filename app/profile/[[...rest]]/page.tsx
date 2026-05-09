"use client";

import { UserProfile } from "@clerk/nextjs";
import { motion } from "framer-motion";
import TopNav from "../../components/TopNav";

export default function ProfilePage() {
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
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <UserProfile />
        </motion.div>
      </div>
    </div>
  );
}
