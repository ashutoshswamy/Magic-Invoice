"use client";

import { useMemo } from "react";
import { useAuth } from "./useAuth";

export const FREE_LIMITS = {
  invoicesPerMonth: Infinity,
};

export type Plan = "free";

export type PlanInfo = {
  plan: Plan;
  isPro: boolean;
  planExpiresAt: Date | null;
  planPeriod: "monthly" | "yearly" | null;
  monthlyInvoices: number;
  canCreateInvoice: boolean;
  isLoaded: boolean;
};

const DEFAULT: PlanInfo = {
  plan: "free",
  isPro: false,
  planExpiresAt: null,
  planPeriod: null,
  monthlyInvoices: 0,
  canCreateInvoice: true,
  isLoaded: false,
};

export function usePlan(): PlanInfo {
  const { isLoaded: isAuthReady } = useAuth();

  return useMemo(() => ({
    ...DEFAULT,
    isLoaded: isAuthReady,
    canCreateInvoice: true,
  }), [isAuthReady]);
}
