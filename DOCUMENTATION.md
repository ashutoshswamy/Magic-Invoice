# Magic Invoice Documentation

## Architecture Overview

Magic Invoice is a modern web application built on the **Next.js App Router**. It leverages a serverless architecture with Supabase for the backend and Google's Gemini for AI-driven features.

### Key Technologies
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, Framer Motion (animations)
- **Database & Auth**: Supabase (PostgreSQL with RLS)
- **AI**: Google Generative AI (Gemini Flash/Pro)

## Project Structure

- `app/`: Contains the application routes and components.
  - `(auth)/`: Authentication pages (Login, Signup, Callback).
  - `analytics/`: Analytics dashboard and revenue visualization.
  - `clients/`: Client directory and management.
  - `dashboard/`: The main workspace for creating and managing invoices.
  - `invoices/`: List and detail views for generated invoices.
  - `api/`: Backend API routes for AI parsing and other server-side logic.
  - `components/`: Reusable UI components (Shared between pages).
  - `lib/`: Utility functions, Supabase clients, and AI configuration.
- `public/`: Static assets like images and fonts.
- `supabase/`: Database migrations and configuration.

## Core Workflows

### 1. AI Invoice Generation
The user provides a natural language description (e.g., "Invoice Google for $500 for SEO consulting"). The `api/parse` route uses Google Gemini to transform this into a structured JSON object representing the invoice, which is then previewed and can be saved to Supabase.

### 2. Client Management
Clients are stored in a dedicated table. When creating an invoice, users can select from existing clients or create new ones on the fly.

### 3. Analytics
The analytics page aggregates data from the `invoices` table to provide insights into total revenue, pending payments, and monthly trends.

## Technical Standards

- **Type Safety**: Full TypeScript integration for both frontend and backend logic.
- **Visual Excellence**: Premium design using Tailwind 4 and professional animations.
- **Security**: Supabase Row Level Security (RLS) ensures that users can only access their own data.
- **Performance**: Optimized builds with Turbopack and React 19's rendering improvements.

