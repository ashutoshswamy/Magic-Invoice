"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

type Toast = { id: number; message: string; kind: "success" | "error" };
type ToastApi = { toast: (message: string, kind?: Toast["kind"]) => void };
const ToastContext = createContext<ToastApi>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastToast = useRef<{ message: string; at: number } | null>(null);
  const toast = (message: string, kind: Toast["kind"] = "success") => {
    const now = Date.now();
    if (lastToast.current?.message === message && now - lastToast.current.at < 1000) return;
    lastToast.current = { message, at: now };
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
    return () => window.removeEventListener("magic-invoice:toast", onToast);
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
