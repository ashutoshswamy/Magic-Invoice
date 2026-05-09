-- ============================================================
-- Magic Invoice — Supabase Schema
-- ============================================================
-- Auth is handled by Clerk. user_id columns store the Clerk
-- user ID (text), NOT a Supabase auth.users UUID.
-- Run this file in the Supabase SQL Editor to bootstrap the DB.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. Extensions
-- ────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ────────────────────────────────────────────────────────────
-- 1. ENUM types
-- ────────────────────────────────────────────────────────────
do $$ begin
  create type invoice_status  as enum ('draft','sent','paid','overdue','cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type gst_type        as enum ('CGST_SGST','IGST','B2C','exempt');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type item_type       as enum ('service','goods');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type expense_category as enum (
    'software','hardware','travel','office',
    'marketing','professional','utilities','other'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type recurring_frequency as enum ('weekly','monthly','quarterly','yearly');
exception when duplicate_object then null;
end $$;

-- ────────────────────────────────────────────────────────────
-- 2. Helper: auto-update updated_at
-- ────────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ────────────────────────────────────────────────────────────
-- 3. user_settings  (one row per user)
-- ────────────────────────────────────────────────────────────
create table if not exists user_settings (
  user_id            text primary key,
  currency           text        not null default 'INR',
  from_name          text        default '',
  from_company       text        default '',
  from_email         text        default '',
  from_gstin         text        default '',
  from_state_code    text        default '',
  from_address_line1 text        default '',
  from_address_line2 text        default '',
  from_city          text        default '',
  from_state         text        default '',
  from_postal_code   text        default '',
  from_country       text        default '',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists trg_user_settings_updated on user_settings;
create trigger trg_user_settings_updated
  before update on user_settings
  for each row execute function set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 4. clients
-- ────────────────────────────────────────────────────────────
create table if not exists clients (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            text        not null,
  name               text        not null,
  company            text,
  email              text,
  phone              text,
  address_line1      text,
  address_line2      text,
  city               text,
  state              text,
  postal_code        text,
  country            text,
  created_at         timestamptz not null default now()
);

create index if not exists idx_clients_user on clients (user_id);

-- ────────────────────────────────────────────────────────────
-- 5. items  (service / goods catalogue)
-- ────────────────────────────────────────────────────────────
create table if not exists items (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            text        not null,
  name               text        not null,
  hsn_sac_code       text        default '',
  type               item_type   not null default 'service',
  default_rate       numeric     not null default 0,
  gst_rate           numeric     not null default 0,
  unit               text        default '',
  description        text        default '',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_items_user on items (user_id);

drop trigger if exists trg_items_updated on items;
create trigger trg_items_updated
  before update on items
  for each row execute function set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 6. invoices
-- ────────────────────────────────────────────────────────────
create table if not exists invoices (
  id                          uuid            primary key default gen_random_uuid(),
  user_id                     text            not null,
  invoice_number              text            not null,
  issued_on                   text            not null,          -- ISO date string
  due_date                    text            not null,          -- ISO date string
  paid                        boolean         not null default false,
  status                      invoice_status  not null default 'draft',
  currency                    text            not null default 'INR',
  notes                       text,
  tax_rate                    numeric         not null default 0,
  gst_type                    gst_type        not null default 'CGST_SGST',
  custom_charges              jsonb           not null default '[]'::jsonb,

  -- Sender (from)
  from_name                   text,
  from_company                text,
  from_email                  text,
  from_address_line1          text,
  from_address_line2          text,
  from_city                   text,
  from_state                  text,
  from_state_code             text,
  from_postal_code            text,
  from_country                text,
  from_gstin                  text,

  -- Recipient (to)
  to_name                     text,
  to_company                  text,
  to_email                    text,
  to_address_line1            text,
  to_address_line2            text,
  to_city                     text,
  to_state                    text,
  to_state_code               text,
  to_postal_code              text,
  to_country                  text,
  to_gstin                    text,

  -- Soft delete
  deleted_at                  timestamptz,

  -- Razorpay payment link
  razorpay_payment_link_id    text,
  razorpay_payment_link_url   text,

  created_at                  timestamptz     not null default now(),
  updated_at                  timestamptz     not null default now()
);

create index if not exists idx_invoices_user       on invoices (user_id);
create index if not exists idx_invoices_user_date  on invoices (user_id, created_at desc);
create index if not exists idx_invoices_status     on invoices (user_id, status);

drop trigger if exists trg_invoices_updated on invoices;
create trigger trg_invoices_updated
  before update on invoices
  for each row execute function set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 7. invoice_lines
-- ────────────────────────────────────────────────────────────
create table if not exists invoice_lines (
  id                 uuid        primary key default gen_random_uuid(),
  invoice_id         uuid        not null references invoices (id) on delete cascade,
  description        text        not null,
  quantity           numeric     not null default 1,
  rate               numeric     not null default 0,
  hsn_sac_code       text,
  sort_order         integer     default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_invoice_lines_invoice on invoice_lines (invoice_id);

drop trigger if exists trg_invoice_lines_updated on invoice_lines;
create trigger trg_invoice_lines_updated
  before update on invoice_lines
  for each row execute function set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 8. expenses
-- ────────────────────────────────────────────────────────────
create table if not exists expenses (
  id                 uuid             primary key default gen_random_uuid(),
  user_id            text             not null,
  vendor             text             not null,
  description        text             default '',
  amount             numeric          not null default 0,
  gst_paid           numeric          not null default 0,
  category           expense_category not null default 'other',
  expense_date       text             not null,                 -- ISO date string
  itc_eligible       boolean          not null default true,
  receipt_url        text,
  created_at         timestamptz      not null default now(),
  updated_at         timestamptz      not null default now()
);

create index if not exists idx_expenses_user on expenses (user_id);

drop trigger if exists trg_expenses_updated on expenses;
create trigger trg_expenses_updated
  before update on expenses
  for each row execute function set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 9. recurring_invoices
-- ────────────────────────────────────────────────────────────
create table if not exists recurring_invoices (
  id                          uuid                primary key default gen_random_uuid(),
  user_id                     text                not null,
  frequency                   recurring_frequency not null default 'monthly',
  next_run_date               text                not null,      -- ISO date string
  last_run_date               text,
  active                      boolean             not null default true,
  due_date_days               integer             not null default 14,
  currency                    text                not null default 'INR',
  tax_rate                    numeric             not null default 0,
  gst_type                    gst_type            not null default 'CGST_SGST',
  notes                       text                default '',
  lines                       jsonb               not null default '[]'::jsonb,
  custom_charges              jsonb               not null default '[]'::jsonb,

  -- Sender (from)
  from_name                   text                default '',
  from_company                text                default '',
  from_email                  text                default '',
  from_address_line1          text                default '',
  from_address_line2          text                default '',
  from_city                   text                default '',
  from_state                  text                default '',
  from_state_code             text                default '',
  from_postal_code            text                default '',
  from_country                text                default '',
  from_gstin                  text                default '',

  -- Recipient (to)
  to_name                     text                default '',
  to_company                  text                default '',
  to_email                    text                default '',
  to_address_line1            text                default '',
  to_address_line2            text                default '',
  to_city                     text                default '',
  to_state                    text                default '',
  to_state_code               text                default '',
  to_postal_code              text                default '',
  to_country                  text                default '',
  to_gstin                    text                default '',

  created_at                  timestamptz         not null default now(),
  updated_at                  timestamptz         not null default now()
);

create index if not exists idx_recurring_user     on recurring_invoices (user_id);
create index if not exists idx_recurring_due      on recurring_invoices (active, next_run_date);

drop trigger if exists trg_recurring_updated on recurring_invoices;
create trigger trg_recurring_updated
  before update on recurring_invoices
  for each row execute function set_updated_at();

-- ============================================================
-- 10. Row Level Security  (RLS)
-- ============================================================
-- Enable RLS on every table. The service-role key used by
-- server-side routes bypasses RLS automatically. Client-side
-- calls via the anon key are governed by these policies.
--
-- The Supabase client on the frontend sends the Clerk JWT
-- which must include a `sub` claim containing the user ID.
-- Configure Supabase JWT secret to match Clerk's JWKS or
-- set the requesting_user_id via a custom claim / RPC.
--
-- Below policies use auth.jwt() ->> 'sub' as the identity.
-- ============================================================

-- Helper function to extract the current Clerk user ID
create or replace function requesting_user_id()
returns text as $$
  select coalesce(
    current_setting('request.jwt.claims', true)::json ->> 'sub',
    (current_setting('request.jwt.claim.sub', true))
  );
$$ language sql stable;

-- ── user_settings ──────────────────────────────────────────
alter table user_settings enable row level security;

create policy "users_own_settings_select" on user_settings
  for select using (user_id = requesting_user_id());
create policy "users_own_settings_insert" on user_settings
  for insert with check (user_id = requesting_user_id());
create policy "users_own_settings_update" on user_settings
  for update using (user_id = requesting_user_id());
create policy "users_own_settings_delete" on user_settings
  for delete using (user_id = requesting_user_id());

-- ── clients ────────────────────────────────────────────────
alter table clients enable row level security;

create policy "users_own_clients_select" on clients
  for select using (user_id = requesting_user_id());
create policy "users_own_clients_insert" on clients
  for insert with check (user_id = requesting_user_id());
create policy "users_own_clients_update" on clients
  for update using (user_id = requesting_user_id());
create policy "users_own_clients_delete" on clients
  for delete using (user_id = requesting_user_id());

-- ── items ──────────────────────────────────────────────────
alter table items enable row level security;

create policy "users_own_items_select" on items
  for select using (user_id = requesting_user_id());
create policy "users_own_items_insert" on items
  for insert with check (user_id = requesting_user_id());
create policy "users_own_items_update" on items
  for update using (user_id = requesting_user_id());
create policy "users_own_items_delete" on items
  for delete using (user_id = requesting_user_id());

-- ── invoices ───────────────────────────────────────────────
alter table invoices enable row level security;

create policy "users_own_invoices_select" on invoices
  for select using (user_id = requesting_user_id());
create policy "users_own_invoices_insert" on invoices
  for insert with check (user_id = requesting_user_id());
create policy "users_own_invoices_update" on invoices
  for update using (user_id = requesting_user_id());
create policy "users_own_invoices_delete" on invoices
  for delete using (user_id = requesting_user_id());

-- ── invoice_lines ──────────────────────────────────────────
-- Lines inherit access through their parent invoice.
alter table invoice_lines enable row level security;

create policy "users_own_lines_select" on invoice_lines
  for select using (
    exists (select 1 from invoices where invoices.id = invoice_lines.invoice_id
            and invoices.user_id = requesting_user_id())
  );
create policy "users_own_lines_insert" on invoice_lines
  for insert with check (
    exists (select 1 from invoices where invoices.id = invoice_lines.invoice_id
            and invoices.user_id = requesting_user_id())
  );
create policy "users_own_lines_update" on invoice_lines
  for update using (
    exists (select 1 from invoices where invoices.id = invoice_lines.invoice_id
            and invoices.user_id = requesting_user_id())
  );
create policy "users_own_lines_delete" on invoice_lines
  for delete using (
    exists (select 1 from invoices where invoices.id = invoice_lines.invoice_id
            and invoices.user_id = requesting_user_id())
  );

-- ── expenses ───────────────────────────────────────────────
alter table expenses enable row level security;

create policy "users_own_expenses_select" on expenses
  for select using (user_id = requesting_user_id());
create policy "users_own_expenses_insert" on expenses
  for insert with check (user_id = requesting_user_id());
create policy "users_own_expenses_update" on expenses
  for update using (user_id = requesting_user_id());
create policy "users_own_expenses_delete" on expenses
  for delete using (user_id = requesting_user_id());

-- ── recurring_invoices ─────────────────────────────────────
alter table recurring_invoices enable row level security;

create policy "users_own_recurring_select" on recurring_invoices
  for select using (user_id = requesting_user_id());
create policy "users_own_recurring_insert" on recurring_invoices
  for insert with check (user_id = requesting_user_id());
create policy "users_own_recurring_update" on recurring_invoices
  for update using (user_id = requesting_user_id());
create policy "users_own_recurring_delete" on recurring_invoices
  for delete using (user_id = requesting_user_id());

-- ============================================================
-- Done. All tables, indexes, triggers, and RLS policies are set.
-- ============================================================
