-- P-Tee schema for Supabase (Postgres)
-- Run in Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  line_user_id        text primary key,
  display_name        text,
  picture_url         text,
  gender              text check (gender in ('male','female')),
  birthdate           date,
  height_cm           int,
  weight_kg           numeric,
  activity            text check (activity in ('sedentary','light','moderate','active','very_active')),
  goal                text check (goal in ('lose','maintain','gain')),
  daily_kcal_target   int,
  timezone            text default 'Asia/Bangkok',
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create table if not exists public.meals (
  id                  uuid primary key default gen_random_uuid(),
  line_user_id        text not null references public.users(line_user_id) on delete cascade,
  eaten_at            timestamptz default now(),
  local_date          date not null,
  input_text          text,
  image_url           text,
  name                text not null,
  kcal                int  not null,
  protein_g           numeric,
  carb_g              numeric,
  fat_g               numeric,
  ai_raw              jsonb,
  ai_confidence       numeric,
  edited_by_user      boolean default false,
  created_at          timestamptz default now()
);

create index if not exists meals_user_date_idx on public.meals (line_user_id, local_date desc);
create index if not exists meals_user_eaten_idx on public.meals (line_user_id, eaten_at desc);

create table if not exists public.weight_logs (
  line_user_id        text not null references public.users(line_user_id) on delete cascade,
  date                date not null,
  weight_kg           numeric not null,
  primary key (line_user_id, date)
);

-- RLS: only service-role key (server) can access. Frontend never talks to Supabase directly.
alter table public.users      enable row level security;
alter table public.meals      enable row level security;
alter table public.weight_logs enable row level security;
-- (No policies = nothing accessible via anon key. Service role bypasses RLS.)

-- Storage bucket for meal photos: create manually in Supabase dashboard:
--   name: meal-photos
--   public: false
