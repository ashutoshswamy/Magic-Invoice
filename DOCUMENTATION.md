# Magic Invoice Documentation

## Overview

Magic Invoice is a Next.js App Router application that turns natural-language prompts into invoice drafts, stores them in Supabase, and provides dashboard workflows for printing, tracking payments, and analyzing revenue.

## Architecture

- **App Router**: Feature pages and APIs are organized in the app directory.
- **UI**: React with motion-enhanced interfaces and utility-first styling.
- **Data**: Postgres-backed storage with row-level access controls.
- **AI Parsing**: Generative AI converts natural language into structured invoices.
- **Email**: Transactional onboarding and notification delivery.

## Product Areas

- **Dashboard**: Prompt-to-invoice workflow, preview, and persistence.
- **Invoices**: Archive, payment status, and printable detail views.
- **Clients**: Reusable client profiles for faster invoice creation.
- **Analytics**: Revenue and payment insights across invoices.
- **Account**: Authentication, preferences, and policy experiences.

## Data Model

Magic Invoice stores invoices, line items, and client records in a user-scoped data model. Access is protected with row-level policies to keep each workspace isolated.

## Integrations

- **AI provider** for structured invoice parsing.
- **Email provider** for onboarding and transactional delivery.
- **Authentication and storage** for secure, persistent data.
