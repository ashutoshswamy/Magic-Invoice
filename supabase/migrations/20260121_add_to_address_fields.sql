alter table public.invoices
  add column if not exists to_address_line1 text,
  add column if not exists to_address_line2 text,
  add column if not exists to_city text,
  add column if not exists to_state text,
  add column if not exists to_postal_code text,
  add column if not exists to_country text;
