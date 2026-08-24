"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebaseClient";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsLoaded(true);
    });
    return unsubscribe;
  }, []);

  return {
    user,
    userId: user?.uid ?? null,
    isSignedIn: !!user,
    isLoaded,
  };
};
