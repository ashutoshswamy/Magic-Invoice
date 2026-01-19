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

          // Check if we already sent a welcome email for this user (stored in localStorage)
          const welcomeEmailKey = `welcome_email_sent_${user.id}`;
          const alreadySentWelcome = localStorage.getItem(welcomeEmailKey) === "true";

          if (alreadySentWelcome) {
            setStatus("Success! Redirecting to dashboard...");
            router.push("/dashboard");
            return;
          }

          // Determine if this is a new user by checking:
          // 1. For OAuth: if the account was created very recently (within last 5 minutes)
          // 2. For email/password: if email was just confirmed (callback type is email confirmation)
          const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
          const now = Date.now();
          const fiveMinutesAgo = now - (5 * 60 * 1000);
          
          // Check if this is a newly created account (created within last 5 minutes)
          const isNewAccount = createdAt > fiveMinutesAgo;
          
          // Get the URL hash to check for email confirmation type
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const urlParams = new URLSearchParams(window.location.search);
          const isEmailConfirmation = hashParams.get("type") === "email" || 
                                       urlParams.get("type") === "email" ||
                                       hashParams.get("type") === "signup" ||
                                       urlParams.get("type") === "signup";



          // Send welcome email if this is a new account OR an email confirmation
          const shouldSendWelcomeEmail = (isNewAccount || isEmailConfirmation) && user.email;

          // Debug logging for production troubleshooting
          console.log("[Welcome Email Debug]", {
            isNewAccount,
            isEmailConfirmation,
            shouldSendWelcomeEmail,
            alreadySentWelcome,
            createdAt: user.created_at,
            timeDiff: now - createdAt,
            hashType: hashParams.get("type"),
            urlType: urlParams.get("type"),
          });

          if (shouldSendWelcomeEmail) {
            setStatus("Sending welcome email...");
            try {
              const name =
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                "";

              console.log("[Welcome Email] Calling /api/welcome with:", { email: user.email, name });

              const response = await fetch("/api/welcome", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  email: user.email,
                  name,
                }),
              });

              const responseData = await response.json();
              console.log("[Welcome Email] API Response:", { status: response.status, ok: response.ok, data: responseData });

              if (response.ok) {
                // Mark welcome email as sent for this user
                localStorage.setItem(welcomeEmailKey, "true");
              }
            } catch (err) {
              console.error("[Welcome Email] Error:", err);
              // Don't block auth flow for email issues
            }
          } else {
            console.log("[Welcome Email] Skipped - conditions not met");
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
