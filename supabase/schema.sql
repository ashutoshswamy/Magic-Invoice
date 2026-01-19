create extension if not exists "uuid-ossp";

create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_number text not null,
  issued_on date not null,
  due_date text not null,
  currency text not null default 'USD',
  notes text,
  from_name text,
  from_company text,
  from_email text,
  from_address_line1 text,
  from_address_line2 text,
  from_city text,
  from_state text,
  from_postal_code text,
  from_country text,
  to_name text,
  to_company text,
  to_email text,
  created_at timestamptz not null default now()
);


create table if not exists public.invoice_lines (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  rate numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.invoices enable row level security;
alter table public.invoice_lines enable row level security;

create policy "Invoices are user-owned" on public.invoices
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Invoice lines follow invoice owner" on public.invoice_lines
  for all
  using (
    exists (
      select 1 from public.invoices
      where invoices.id = invoice_lines.invoice_id
      and invoices.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.invoices
      where invoices.id = invoice_lines.invoice_id
      and invoices.user_id = auth.uid()
    )
  );
