"use client";

import { SignIn } from "@clerk/nextjs";
import TopNav from "../../components/TopNav";

export default function LoginPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <TopNav />
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "64px 24px 80px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 36,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p className="section-label" style={{ marginBottom: 12 }}>Welcome back</p>
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
            Sign in to Magic Invoice
          </h1>
        </div>
        <SignIn forceRedirectUrl="/dashboard" />
      </div>
    </div>
  );
}
