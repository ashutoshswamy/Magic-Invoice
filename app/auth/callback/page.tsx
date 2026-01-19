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

          // Determine if this is an OAuth user or email/password user
          const identities = user.identities || [];
          const hasOAuthIdentity = identities.some(
            (id) => id.provider === "google" || id.provider === "github"
          );
          const hasEmailIdentity = identities.some(
            (id) => id.provider === "email"
          );

          // Check if this is a new user by comparing created_at with last_sign_in_at
          // For new users, these will be equal (or very close) on their first login
          const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
          const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
          
          // For OAuth users: send welcome email immediately on first login
          // For email/password users: send welcome email after email confirmation
          // The callback is reached when:
          // 1. OAuth user completes sign in (new or returning)
          // 2. Email user clicks confirmation link (first login after signup)
          const isNewOAuthUser = hasOAuthIdentity && !hasEmailIdentity && 
            createdAt > 0 && Math.abs(createdAt - lastSignIn) < 5000;
          
          // For email users, this is their first confirmed login if:
          // - They have an email identity
          // - created_at and last_sign_in_at are close (first real login after confirmation)
          const isEmailConfirmation = hasEmailIdentity && !hasOAuthIdentity &&
            createdAt > 0 && Math.abs(createdAt - lastSignIn) < 60000; // 60 seconds buffer for email confirmation

          const shouldSendWelcomeEmail = (isNewOAuthUser || isEmailConfirmation) && user.email;

          if (shouldSendWelcomeEmail) {
            // Send welcome email for new users (OAuth or email confirmation)
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
