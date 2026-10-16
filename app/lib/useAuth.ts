"use client";

import { useEffect, useState } from "react";
import { onIdTokenChanged, type User } from "firebase/auth";
import { auth } from "./firebaseClient";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const hasSession = () => document.cookie.split("; ").some((cookie) => cookie.startsWith("has_session="));
    let cancelled = false;
    const unsubscribe = onIdTokenChanged(auth, async (nextUser) => {
      if (nextUser && !hasSession()) {
        try {
          const response = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: await nextUser.getIdToken() }),
          });
          if (!response.ok) throw new Error("Session sync failed");
        } catch {
          if (!cancelled) { setUser(null); setIsLoaded(true); }
          return;
        }
      }
      if (!cancelled) {
        setUser(nextUser);
        setIsLoaded(true);
      }
    });
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  return {
    user,
    userId: user?.uid ?? null,
    isSignedIn: !!user,
    isLoaded,
  };
};
