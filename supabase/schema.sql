create table if not exists public.saved_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  summary text not null,
  extracted_text text not null,
  study_material jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.saved_notes enable row level security;

drop policy if exists "Users can read own saved notes" on public.saved_notes;
create policy "Users can read own saved notes"
on public.saved_notes
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own saved notes" on public.saved_notes;
create policy "Users can create own saved notes"
on public.saved_notes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own saved notes" on public.saved_notes;
create policy "Users can delete own saved notes"
on public.saved_notes
for delete
to authenticated
using (auth.uid() = user_id);
