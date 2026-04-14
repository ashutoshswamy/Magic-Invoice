"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing login...");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          setStatus("Authentication failed. Redirecting to login...");
          setTimeout(() => router.push("/login"), 2000);
          return;
        }

        if (session?.user) {
          setStatus("Success! Redirecting to dashboard...");
          router.push("/dashboard");
        } else {

          // No session found, wait and retry
          setTimeout(async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
              router.push("/dashboard");
            } else {
              setStatus("Session not found. Redirecting to login...");
              setTimeout(() => router.push("/login"), 2000);
            }
          }, 1000);
        }
      } catch {
        setStatus("An error occurred. Redirecting to login...");
        setTimeout(() => router.push("/login"), 2000);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-400 mx-auto mb-4"></div>
        <p className="text-slate-300">{status}</p>
      </div>
    </div>
  );
}
