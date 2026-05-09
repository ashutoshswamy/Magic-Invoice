# Magic Invoice Documentation

## Architecture Overview

Magic Invoice is a modern web application built on the **Next.js App Router**. It leverages a serverless architecture with Supabase for the backend and Google's Gemini for AI-driven features.

### Key Technologies
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, Framer Motion (animations)
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Clerk
- **AI**: Google Generative AI (Gemini Flash/Pro)
- **Payments**: Razorpay

## Project Structure

- `app/`: Contains the application routes and components.
  - `analytics/`: Analytics dashboard and revenue visualization.
  - `api/`: Backend API routes (AI parsing, Razorpay, recurring tasks).
  - `auth/`: Authentication callback handling.
  - `billing/`: Billing management (currently disabled/free-only).
  - `clients/`: Client directory and management.
  - `components/`: Reusable UI components.
  - `dashboard/`: The main workspace for creating and managing invoices.
  - `expenses/`: Expense tracking and management.
  - `gstr/`: GST reporting and insights.
  - `invoices/`: List and detail views for generated invoices.
  - `items/`: Item and service management.
  - `lib/`: Utility functions, Supabase clients, and AI configuration.
  - `login/` & `signup/`: Authentication pages powered by Clerk.
  - `recurring/`: Recurring invoice management.
- `public/`: Static assets like images and fonts.
- `supabase/`: Database migrations and configuration.

## Core Workflows

### 1. AI Invoice Generation
The user provides a natural language description (e.g., "Invoice Google for $500 for SEO consulting"). The `api/parse` route uses Google Gemini to transform this into a structured JSON object representing the invoice, which is then previewed and can be saved to Supabase.

### 2. Client Management
Clients are stored in a dedicated table. When creating an invoice, users can select from existing clients or create new ones on the fly.

### 3. Analytics & Reporting
The analytics page aggregates data from the `invoices` and `expenses` tables to provide insights into total revenue, pending payments, and tax-ready GST reports.

### 4. Payment Integration
Invoices can be shared with clients along with a Razorpay payment link. The application tracks payment status through Razorpay webhooks, automatically updating the invoice status upon successful transaction.

## Technical Standards

- **Type Safety**: Full TypeScript integration for both frontend and backend logic.
- **Visual Excellence**: Premium design using Tailwind 4 and professional animations.
- **Security**: Supabase Row Level Security (RLS) ensures that users can only access their own data.
- **Performance**: Optimized builds with Turbopack and React 19's rendering improvements.

