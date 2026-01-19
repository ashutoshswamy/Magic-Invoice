"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Github, Mail, Lock, Sparkles } from "lucide-react";
import TopNav from "../components/TopNav";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!isSupabaseConfigured) {
      setStatus("Connect your workspace to continue.");
      return;
    }
    setIsLoading(true);
    setStatus(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/dashboard");
    } catch (error) {
      setStatus("Login failed. Check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    if (!isSupabaseConfigured) {
      setStatus("Connect your workspace to continue.");
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <TopNav />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 pb-16 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass mx-auto w-full max-w-md rounded-3xl p-8"
        >
          <div className="flex items-center gap-2 text-sm text-emerald-200">
            <Sparkles className="h-4 w-4" />
            Welcome back
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-white">
            Sign in to Magic Invoice
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Access your invoices, storage, and billing history.
          </p>

          <div className="mt-6 space-y-4">
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
              <Mail className="h-4 w-4 text-emerald-200" />
              <input
                type="email"
                placeholder="Email address"
                className="w-full bg-transparent text-white outline-none"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
              <Lock className="h-4 w-4 text-emerald-200" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full bg-transparent text-white outline-none"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-slate-300 transition hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </label>
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full rounded-full bg-emerald-400 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
            <button
              onClick={() => handleOAuth("google")}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 py-3 text-sm font-semibold text-white transition hover:border-white/50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.6-5.4 3.6-3.2 0-5.8-2.6-5.8-5.7s2.6-5.7 5.8-5.7c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.6 3.8 14.5 2.8 12 2.8 7.7 2.8 4.2 6.2 4.2 10.5S7.7 18.2 12 18.2c5 0 6.9-3.5 6.9-6.6 0-.4 0-.7-.1-1.4H12z"
                />
                <path
                  fill="#FBBC05"
                  d="M4.2 10.5c0-.7.1-1.4.3-2.1L1.6 6.4C.7 8.2.2 10.1.2 12.1c0 2 .5 3.8 1.4 5.4l3-2.3c-.2-.7-.4-1.5-.4-2.7z"
                />
                <path
                  fill="#34A853"
                  d="M12 21.8c2.6 0 4.7-.9 6.3-2.3l-3-2.3c-.8.6-1.9 1-3.3 1-2.5 0-4.6-1.7-5.3-4.1l-3 2.3c1.6 3.1 4.8 5.4 8.3 5.4z"
                />
                <path
                  fill="#4285F4"
                  d="M20.9 12.1c0-.7-.1-1.2-.2-1.9H12v3.9h5.4c-.3 1.4-1.5 2.7-3.4 3.5l3 2.3c1.8-1.6 2.9-4 2.9-7.8z"
                />
              </svg>
              Continue with Google
            </button>
            <button
              onClick={() => handleOAuth("github")}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 py-3 text-sm font-semibold text-white transition hover:border-white/50"
            >
              <Github className="h-4 w-4" />
              Continue with GitHub
            </button>
            {status ? (
              <p className="text-xs text-emerald-200">{status}</p>
            ) : null}
          </div>
          <p className="mt-6 text-sm text-slate-300">
            Need an account?{" "}
            <Link href="/signup" className="text-emerald-200">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
