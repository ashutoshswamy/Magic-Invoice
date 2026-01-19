create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  company text,
  email text,
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "Clients are user-owned" on public.clients
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
