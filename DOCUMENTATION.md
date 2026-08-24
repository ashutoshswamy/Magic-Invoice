# Magic Invoice Documentation

## Architecture Overview

Magic Invoice is a modern web application built on the **Next.js App Router**. It leverages Firebase (Firestore + Firebase Auth) for the backend and advanced AI-driven features.

### Key Technologies
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, Framer Motion, GSAP (animations)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (session cookie issued via `api/auth/session`, verified server-side with `firebase-admin`)
- **AI**: Google Generative AI
- **Payments**: Razorpay
- **Email**: Resend

## Project Structure

- `app/`: Contains the application routes and components.
  - `analytics/`: Analytics dashboard and revenue visualization.
  - `api/`: Backend API routes (AI parsing, Razorpay, recurring tasks, auth session/logout).
  - `auth/callback/`: Authentication callback handling.
  - `billing/`: Billing management (currently disabled/free-only).
  - `clients/`: Client directory and management.
  - `components/`: Reusable UI components.
  - `dashboard/`: The main workspace for creating and managing invoices.
  - `expenses/`: Expense tracking and management.
  - `gstr/`: GST reporting and insights.
  - `invoices/`: List and detail views for generated invoices.
  - `items/`: Item and service management.
  - `lib/`: Utility functions, Firebase client/admin SDKs (`firebaseClient.ts`, `firebaseAdmin.ts`), auth helpers (`useAuth.ts`, `requireAuth.ts`), and rate limiting.
  - `login/`, `signup/`, `profile/`: Authentication and account pages powered by Firebase Auth.
  - `privacy/`, `terms/`, `cookies/`: Static legal pages.
  - `recurring/`: Recurring invoice management.
- `public/`: Static assets like images and fonts.
- `firestore.rules`: Firestore security rules (per-user data isolation via `user_id`/owner checks).
- `firestore.indexes.json`: Firestore composite index definitions.
- `firebase.json`: Firebase project configuration.

## Core Workflows

### 1. AI Invoice Generation
The user provides a natural language description (e.g., "Invoice Google for $500 for SEO consulting"). The `api/parse` route uses advanced AI models to transform this into a structured JSON object representing the invoice, which is then previewed and can be saved to Firestore.

### 2. Client Management
Clients are stored in a dedicated Firestore collection. When creating an invoice, users can select from existing clients or create new ones on the fly.

### 3. Analytics & Reporting
The analytics page aggregates data from the `invoices` and `expenses` collections to provide insights into total revenue, pending payments, and tax-ready GST reports.

### 4. Payment Integration
Invoices can be shared with clients along with a Razorpay payment link. The application tracks payment status through Razorpay webhooks, automatically updating the invoice status upon successful transaction.

## Authentication

Auth is handled by Firebase: the client SDK (`app/lib/firebaseClient.ts`) manages sign-in, while `app/api/auth/session` exchanges an ID token for a session cookie and `app/api/auth/logout` clears it. Server-side API routes verify the caller via `requireAuth` (`app/lib/requireAuth.ts`), which validates the bearer ID token with the Firebase Admin SDK (`app/lib/firebaseAdmin.ts`).

## Technical Standards

- **Type Safety**: Full TypeScript integration for both frontend and backend logic.
- **Visual Excellence**: Premium design using Tailwind 4 and professional animations.
- **Security**: Firestore security rules (`firestore.rules`) enforce per-user data isolation based on `user_id` ownership checks.
- **Performance**: Optimized builds with Turbopack and React 19's rendering improvements.

