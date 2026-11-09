"use client";

import { createContext, useCallback, useContext, useEffect } from "react";
import { Toaster, sileo } from "sileo";
import "sileo/styles.css";

type Kind = "success" | "error" | "info" | "warning";
type ToastApi = { toast: (message: string, kind?: Kind, description?: string) => void };

// One place that talks to sileo. Everything on the site goes through toast().
// ponytail: sileo already stacks and times out; no custom de-dupe, add if double-fires show up.
function fire(message: string, kind: Kind = "success", description?: string) {
  sileo[kind]({ title: message, description });
}

const ToastContext = createContext<ToastApi>({ toast: fire });

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  // Non-React callers (e.g. lib code) can still fire a toast via a window event.
  useEffect(() => {
    const onToast = (event: Event) => {
      const d = (event as CustomEvent<{ message: string; kind?: Kind; description?: string }>).detail;
      if (d?.message) fire(d.message, d.kind, d.description);
    };
    window.addEventListener("magic-invoice:toast", onToast);
    return () => window.removeEventListener("magic-invoice:toast", onToast);
  }, []);

  return (
    <ToastContext.Provider value={{ toast: fire }}>
      {children}
      <Toaster position="bottom-right" theme="dark" options={{ fill: "#17130f", roundness: 14 }} />
    </ToastContext.Provider>
  );
}

const ERROR_RE = /unable|fail|required|must be|log in|error|missing|check |enter |denied|invalid|can't|cannot/i;

// Drop-in for `const [status, setStatus] = useState(...)` on app screens:
// each message becomes a sileo toast, so no screen renders its own status line.
export function useStatus(): [null, (message: string | null) => void] {
  const { toast } = useToast();
  const setStatus = useCallback((m: string | null) => { if (m) toast(m, ERROR_RE.test(m) ? "error" : "success"); }, [toast]);
  return [null, setStatus];
}
