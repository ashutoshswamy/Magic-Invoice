import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;
      const isNewUser =
        user.created_at &&
        new Date().getTime() - new Date(user.created_at).getTime() < 60000; // Created within the last minute

      if (isNewUser) {
        // Send welcome email for new OAuth users
        try {
          const email = user.email;
          const name =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            "";

          if (email) {
            await fetch(`${origin}/api/welcome`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email,
                name,
              }),
            });
          }
        } catch (emailError) {
          // Log but don't block the auth flow
          console.error("Failed to send welcome email:", emailError);
        }
      }
    }
  }

  // Redirect to dashboard after successful auth
  return NextResponse.redirect(`${origin}/dashboard`);
}
