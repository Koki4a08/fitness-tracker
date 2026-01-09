-- Core tables for fitness tracker

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  username text unique,
  updated_at timestamptz not null default now()
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  focus text,
  started_at timestamptz,
  date date,
  duration_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  name text not null,
  sets integer,
  reps integer,
  weight numeric(10, 2),
  created_at timestamptz not null default now()
);

create index if not exists workouts_user_id_idx on public.workouts(user_id);
create index if not exists workout_exercises_workout_id_idx on public.workout_exercises(workout_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists workouts_set_updated_at on public.workouts;
create trigger workouts_set_updated_at
before update on public.workouts
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid());

create policy "workouts_select_own"
on public.workouts
for select
to authenticated
using (user_id = auth.uid());

create policy "workouts_insert_own"
on public.workouts
for insert
to authenticated
with check (user_id = auth.uid());

create policy "workouts_update_own"
on public.workouts
for update
to authenticated
using (user_id = auth.uid());

create policy "workouts_delete_own"
on public.workouts
for delete
to authenticated
using (user_id = auth.uid());

create policy "workout_exercises_select_own"
on public.workout_exercises
for select
to authenticated
using (
  exists (
    select 1
    from public.workouts
    where workouts.id = workout_exercises.workout_id
      and workouts.user_id = auth.uid()
  )
);

create policy "workout_exercises_insert_own"
on public.workout_exercises
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workouts
    where workouts.id = workout_exercises.workout_id
      and workouts.user_id = auth.uid()
  )
);

create policy "workout_exercises_update_own"
on public.workout_exercises
for update
to authenticated
using (
  exists (
    select 1
    from public.workouts
    where workouts.id = workout_exercises.workout_id
      and workouts.user_id = auth.uid()
  )
);

create policy "workout_exercises_delete_own"
on public.workout_exercises
for delete
to authenticated
using (
  exists (
    select 1
    from public.workouts
    where workouts.id = workout_exercises.workout_id
      and workouts.user_id = auth.uid()
  )
);
