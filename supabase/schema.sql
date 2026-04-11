create extension if not exists "pgcrypto";

create table if not exists public.pins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) > 0 and char_length(title) <= 80),
  note text check (char_length(coalesce(note, '')) <= 280),
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now()
);

create index if not exists pins_user_created_at_idx
  on public.pins(user_id, created_at desc);

alter table public.pins enable row level security;

create policy "Pins are readable by owner"
  on public.pins
  for select
  using (auth.uid() = user_id);

create policy "Pins are insertable by owner"
  on public.pins
  for insert
  with check (auth.uid() = user_id);

create policy "Pins are deletable by owner"
  on public.pins
  for delete
  using (auth.uid() = user_id);
