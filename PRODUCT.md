# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Indian freelancers and small businesses who must issue GST-compliant invoices and file GSTR returns. (Inferred from README/copy; not interviewed.)

## Product Purpose
Magic Invoice turns one plain sentence into a GST invoice (line items, HSN/SAC codes, CGST/SGST/IGST split), then handles clients, items, expenses and ITC, recurring invoices, Razorpay payment links, GSTR-1 export and GSTR-3B summary, and revenue analytics. Free, unlimited.

## Positioning
Sentence-to-invoice drafting that gets Indian GST right (intra/inter-state tax type from both GSTINs, SAC codes inferred), at no cost.

## Operating Context
Invoices are printed as A4 PDFs and shared via Razorpay links; data lives in Firebase (Firestore + Auth); AI drafting uses Google Gemini. Amounts in INR with Indian digit grouping.

## Capabilities and Constraints
Toasts must use the `sileo` library. Routes, copy and function stay as is. Light and dark themes both supported. Print layout of invoices must keep working.

## Brand Commitments
Name "Magic Invoice". Visual world is open: user asked for a new visual world across the whole site.

## Evidence on Hand
No customer logos, testimonials or usage numbers exist; none may be fabricated.

## Product Principles
- Show the sentence becoming an invoice; that is the proof.
- Tax correctness over decoration.
- Free means no upsell surfaces.

## Accessibility & Inclusion
Respect prefers-reduced-motion; WCAG AA contrast in both themes.
