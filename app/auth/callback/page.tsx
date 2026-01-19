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
          const user = session.user;

          // Check if this is a new user (created within the last 60 seconds)
          const isNewUser =
            user.created_at &&
            new Date().getTime() - new Date(user.created_at).getTime() < 60000;

          if (isNewUser && user.email) {
            // Send welcome email for new OAuth users
            setStatus("Sending welcome email...");
            try {
              const name =
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                "";

              await fetch("/api/welcome", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: user.email,
                  name,
                }),
              });
            } catch {
              // Silently fail - don't block auth flow for email issues
            }
          }

          // Redirect to dashboard
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
