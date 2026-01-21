alter table public.invoices
  add column if not exists tax_rate numeric not null default 0,
  add column if not exists custom_charges jsonb not null default '[]'::jsonb;
