"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Toast = { id: number; message: string; kind: "success" | "error" };
type ToastApi = { toast: (message: string, kind?: Toast["kind"]) => void };
const ToastContext = createContext<ToastApi>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (message: string, kind: Toast["kind"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, kind }]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 3200);
  };

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<{ message: string; kind?: Toast["kind"] }>).detail;
      if (detail?.message) toast(detail.message, detail.kind);
    };
    window.addEventListener("magic-invoice:toast", onToast);
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const input = args[0];
      const url = typeof input === "string" ? input : input instanceof Request ? input.url : input.toString();
      const method = (args[1]?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
      if (response.ok && /^(POST|PATCH|DELETE)$/.test(method) && !url.includes("/api/auth/")) toast("Task completed.");
      return response;
    };
    return () => {
      window.removeEventListener("magic-invoice:toast", onToast);
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((item) => <div key={item.id} className={`toast toast-${item.kind}`}>{item.message}</div>)}
      </div>
    </ToastContext.Provider>
  );
}
