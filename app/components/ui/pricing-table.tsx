"use client";

import * as React from "react";
import { useState } from "react";
import { Check, Minus } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface Feature {
  id: string;
  name: string;
  included: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  tagline: string;
  description: string;
  features: Feature[];
  isRecommended?: boolean;
  buttonText: string;
  buttonHref?: string;
  disabled?: boolean;
  badge?: string;
}

export type BillingCycle = "monthly" | "annually";

export interface PricingTableProps extends Omit<
  React.ComponentPropsWithoutRef<"div">,
  "onSelect"
> {
  plans: PricingPlan[];
  billingCycle: BillingCycle;
  onSelect: (planId: string) => void;
  onCycleChange?: (cycle: BillingCycle) => void;
  activePlanId?: string;
  cycleToggleLabel?: string;
}

/* ── Billing Cycle Toggle ────────────────────────────────────────────────────── */

const BillingCycleToggle: React.FC<{
  billingCycle: BillingCycle;
  onCycleChange: (c: BillingCycle) => void;
}> = ({ billingCycle, onCycleChange }) => {
  const isMonthly = billingCycle === "monthly";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        marginBottom: 56,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: isMonthly ? "var(--cream)" : "var(--text-muted)",
          transition: "color 0.2s",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => onCycleChange("monthly")}
      >
        Monthly
      </span>

      <button
        onClick={() => onCycleChange(isMonthly ? "annually" : "monthly")}
        aria-label="Toggle billing cycle"
        aria-checked={!isMonthly}
        role="switch"
        style={{
          position: "relative",
          width: 44,
          height: 24,
          background: !isMonthly ? "var(--gold)" : "var(--ink-raised)",
          border: `1px solid ${!isMonthly ? "var(--gold)" : "var(--border-bright)"}`,
          borderRadius: 12,
          cursor: "pointer",
          transition: "background 0.25s, border-color 0.25s",
          flexShrink: 0,
          padding: 0,
          outline: "none",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: !isMonthly ? 23 : 3,
            width: 16,
            height: 16,
            background: !isMonthly ? "var(--ink)" : "var(--text-muted)",
            borderRadius: "50%",
            transition: "left 0.25s ease, background 0.25s",
            display: "block",
          }}
        />
      </button>

      <span
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: !isMonthly ? "var(--cream)" : "var(--text-muted)",
          transition: "color 0.2s",
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => onCycleChange("annually")}
      >
        Annually
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 8,
            fontWeight: 600,
            letterSpacing: "0.12em",
            background: !isMonthly ? "var(--gold)" : "transparent",
            color: !isMonthly ? "var(--ink)" : "var(--text-muted)",
            padding: "2px 7px",
            borderRadius: 1,
            border: !isMonthly ? "none" : "1px solid var(--border)",
            transition: "all 0.25s",
          }}
        >
          −20%
        </span>
      </span>
    </div>
  );
};

/* ── Plan Card ──────────────────────────────────────────────────────────────── */

const PlanCard: React.FC<{
  plan: PricingPlan;
  billingCycle: BillingCycle;
  onSelect: (id: string) => void;
  isActive: boolean;
}> = ({ plan, billingCycle, onSelect, isActive }) => {
  const isAnnual = billingCycle === "annually";
  const price =
    plan.price === 0 ? 0 : isAnnual ? Math.round(plan.price * 0.8) : plan.price;
  const isHighlighted = plan.isRecommended || isActive;

  return (
      <motion.div
      whileHover={{ y: -8, boxShadow: "0 40px 80px -20px rgba(217, 119, 6, 0.2)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="pricing-card"
      style={{
        background: isHighlighted 
          ? "linear-gradient(165deg, rgba(22,19,16,0.9) 0%, rgba(12,10,6,1) 100%)" 
          : "rgba(18,15,12,0.6)",
        border: `1px solid ${isHighlighted ? "var(--gold-dim)" : "var(--border)"}`,
        borderRadius: 8,
        padding: "clamp(24px, 5vw, 48px) clamp(20px, 4vw, 40px)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        height: "100%",
        boxShadow: isHighlighted ? "0 24px 48px -12px rgba(217, 119, 6, 0.12)" : "none",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Border gradient effect */}
      {isHighlighted && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: 1,
            background: "linear-gradient(135deg, var(--gold) 0%, transparent 40%, var(--gold-dim) 100%)",
            borderRadius: 8,
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Ruled-line bg texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(transparent,transparent 39px,rgba(215,183,120,0.02) 39px,rgba(215,183,120,0.02) 40px)",
          pointerEvents: "none",
          opacity: isHighlighted ? 1 : 0.5,
        }}
      />

      {/* Top badge */}
      {(plan.badge || plan.isRecommended) && (
        <div
          style={{
            position: "absolute",
            top: 24,
            right: 24,
            background: plan.isRecommended
              ? "var(--gold)"
              : "var(--ink-surface)",
            color: plan.isRecommended ? "var(--ink)" : "var(--text-primary)",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            padding: "4px 12px",
            borderRadius: 4,
            zIndex: 1,
            boxShadow: plan.isRecommended ? "0 4px 12px rgba(217, 119, 6, 0.3)" : "none",
          }}
        >
          {plan.isRecommended ? "Recommended" : plan.badge}
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Tagline */}
        <p
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: isHighlighted ? "var(--gold-bright)" : "var(--text-muted)",
            marginBottom: 12,
          }}
        >
          {plan.tagline}
        </p>

        {/* Plan name */}
        <h3
          style={{
            fontFamily: "var(--font-playfair), serif",
            fontWeight: 600,
            fontSize: 36,
            color: "var(--text-primary)",
            margin: "0 0 32px",
            lineHeight: 1.1,
          }}
        >
          {plan.name}
        </h3>

        {/* Price block */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 4,
              lineHeight: 1,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontSize: 24,
                fontWeight: 600,
                color: "var(--gold)",
                marginTop: 8,
              }}
            >
              ₹
            </span>
            <span
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontSize: 84,
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.04em",
                lineHeight: 0.9,
              }}
            >
              {price}
            </span>
            {plan.price > 0 && (
              <span
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 12,
                  color: "var(--text-muted)",
                  alignSelf: "flex-end",
                  marginBottom: 8,
                  marginLeft: 4,
                  letterSpacing: "0.06em",
                }}
              >
                / month
              </span>
            )}
          </div>

          {isAnnual && plan.price > 0 && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginTop: 12,
                padding: "4px 10px",
                background: "rgba(217, 119, 6, 0.1)",
                borderRadius: 4,
                border: "1px solid rgba(217, 119, 6, 0.2)",
              }}
            >
              <span style={{ 
                fontFamily: "var(--font-mono), monospace", 
                fontSize: 10, 
                color: "var(--gold)",
                fontWeight: 600
              }}>
                SAVE 20%
              </span>
              <span style={{ 
                fontFamily: "var(--font-mono), monospace", 
                fontSize: 10, 
                color: "var(--text-muted)",
                textDecoration: "line-through" 
              }}>
                ₹{plan.price}
              </span>
            </div>
          )}
          {plan.price === 0 && (
            <p
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11,
                color: "var(--gold)",
                marginTop: 12,
                letterSpacing: "0.06em",
                fontWeight: 600,
                textTransform: "uppercase"
              }}
            >
              Limited Time Offer
            </p>
          )}
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "linear-gradient(90deg, var(--border) 0%, transparent 100%)",
            marginBottom: 32,
          }}
        />

        {/* Description */}
        <p
          style={{
            fontSize: 15,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: 32,
          }}
        >
          {plan.description}
        </p>

        {/* Feature list */}
        <div style={{ marginBottom: 40, flexGrow: 1 }}>
          <p style={{ 
            fontFamily: "var(--font-mono), monospace", 
            fontSize: 10, 
            color: "var(--text-muted)", 
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            marginBottom: 16
          }}>
            What&apos;s included:
          </p>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 12,
            }}
          >
            {plan.features.map((feature) => (
              <li
                key={feature.id}
                style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
              >
                <div style={{ 
                  marginTop: 3,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: feature.included ? "rgba(217, 119, 6, 0.15)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  {feature.included ? (
                    <Check
                      size={10}
                      style={{ color: "var(--gold)" }}
                      strokeWidth={3}
                    />
                  ) : (
                    <Minus
                      size={10}
                      style={{ color: "var(--text-muted)" }}
                      strokeWidth={2}
                    />
                  )}
                </div>
                <span
                  style={{
                    fontSize: 13,
                    lineHeight: 1.4,
                    color: feature.included
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  }}
                >
                  {feature.name}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div>
          {plan.buttonHref && !plan.disabled ? (
            <Link
              href={plan.buttonHref}
              className={isHighlighted ? "btn-gold" : "btn-ghost"}
              style={{
                textDecoration: "none",
                display: "flex",
                justifyContent: "center",
                padding: "16px",
                fontSize: 13,
                letterSpacing: "0.1em",
              }}
            >
              {plan.buttonText}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => !plan.disabled && onSelect(plan.id)}
              disabled={plan.disabled}
              className="btn-ghost"
              style={{
                width: "100%",
                textAlign: "center",
                padding: "16px",
                fontSize: 13,
                letterSpacing: "0.1em",
                cursor: plan.disabled ? "not-allowed" : "pointer",
                opacity: plan.disabled ? 0.4 : 1,
              }}
            >
              {plan.buttonText}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ── PricingTable (Main Export) ──────────────────────────────────────────────── */

export const PricingTable: React.FC<PricingTableProps> = ({
  plans,
  billingCycle,
  onSelect,
  onCycleChange,
  activePlanId,
  className,
  ...props
}) => {
  const isSinglePlan = plans.length === 1;

  return (
    <div className={className} {...props}>
      {onCycleChange && !isSinglePlan && (
        <BillingCycleToggle
          billingCycle={billingCycle}
          onCycleChange={onCycleChange}
        />
      )}
      <div 
        style={{
          display: "grid",
          gridTemplateColumns: isSinglePlan ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 24,
          maxWidth: isSinglePlan ? 520 : 1000,
          margin: "0 auto",
        }}
      >
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billingCycle={billingCycle}
            onSelect={onSelect}
            isActive={plan.id === activePlanId}
          />
        ))}
      </div>
    </div>
  );
};

/* ── Magic Invoice plans data ────────────────────────────────────────────────── */

export const MAGIC_INVOICE_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    tagline: "Free forever",
    description:
      "Everything a freelancer or SME needs to run invoicing, GST, and client delivery in one place.",
    features: [
      { id: "f1", name: "Unlimited invoices", included: true },
      { id: "f2", name: "AI natural language parsing", included: true },
      { id: "f3", name: "CGST / SGST / IGST detection", included: true },
      { id: "f4", name: "HSN / SAC code lookup", included: true },
      { id: "f5", name: "GSTR-1 + GSTR-3B export", included: true },
      { id: "f6", name: "Expense tracking + ITC", included: true },
      {id: "f7", name: "Recurring invoices", included: true},
      {id: "f10", name: "Branded PDF download", included: true},
      {id: "f11", name: "AI cash flow insights", included: true},
    ],
    buttonText: "Start free →",
    buttonHref: "/signup",
    badge: "Free only",
  },
];

/* ── Default export (demo / standalone) ─────────────────────────────────────── */

const ExamplePricingTable = () => {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--ink)",
        padding: "64px 24px",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <p
          className="section-label"
          style={{ textAlign: "center", marginBottom: 16 }}
        >
          Pricing
        </p>
        <h1
          style={{
            fontFamily: "var(--font-playfair), serif",
            fontWeight: 600,
            fontSize: "clamp(28px, 4vw, 44px)",
            color: "var(--text-primary)",
            textAlign: "center",
            lineHeight: 1.2,
            margin: "0 0 56px",
          }}
        >
          Simple, transparent{" "}
          <em style={{ color: "var(--gold)", fontStyle: "italic" }}>
            pricing.
          </em>
        </h1>
        <PricingTable
          plans={MAGIC_INVOICE_PLANS}
          billingCycle={cycle}
          onSelect={(id) => console.log("Selected:", id)}
          onCycleChange={setCycle}
          activePlanId="starter"
        />
      </div>
    </div>
  );
};

export default ExamplePricingTable;
