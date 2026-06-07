
-- =========================================================
-- Velocity & Flow ATS schema
-- =========================================================

create extension if not exists pgcrypto;

-- ---------- workspaces ----------
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null,
  logo_url text,
  created_at timestamptz not null default now()
);

-- ---------- users (profile rows, one per auth user) ----------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'member',
  created_at timestamptz not null default now()
);

create index users_workspace_id_idx on public.users(workspace_id);

-- Security definer helper: workspace for the current auth user
create or replace function public.current_workspace_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id from public.users where id = auth.uid()
$$;

-- ---------- workspace_themes ----------
create table public.workspace_themes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  is_active boolean not null default true,
  primary_color text not null default '#6366f1',
  accent_color text not null default '#8b5cf6',
  bg_color text not null default '#0f1117',
  surface_color text not null default '#1a1d27',
  text_color text not null default '#f1f5f9',
  font_family text not null default 'Inter',
  created_at timestamptz not null default now()
);
create index workspace_themes_ws_idx on public.workspace_themes(workspace_id);

-- ---------- candidates ----------
create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now()
);
create index candidates_ws_idx on public.candidates(workspace_id);

-- ---------- jobs ----------
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  department text,
  status text not null default 'open',
  due_date date,
  description text,
  created_at timestamptz not null default now()
);
create index jobs_ws_idx on public.jobs(workspace_id);

-- ---------- applications ----------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  stage text not null default 'applied',
  created_at timestamptz not null default now()
);
create index applications_ws_idx on public.applications(workspace_id);
create index applications_job_idx on public.applications(job_id);

-- ---------- interviews ----------
create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  scheduled_at timestamptz not null,
  status text not null default 'scheduled',
  type text not null default 'phone',
  created_at timestamptz not null default now()
);
create index interviews_ws_idx on public.interviews(workspace_id);

-- ---------- offers ----------
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  status text not null default 'pending',
  salary numeric,
  currency text not null default 'USD',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index offers_ws_idx on public.offers(workspace_id);

-- ---------- activity_log ----------
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid,
  action text not null,
  created_at timestamptz not null default now()
);
create index activity_log_ws_idx on public.activity_log(workspace_id, created_at desc);

-- =========================================================
-- GRANTS
-- =========================================================
grant select, insert, update, delete on public.workspaces to authenticated;
grant select on public.workspaces to anon; -- public job board needs workspace slug lookup
grant all on public.workspaces to service_role;

grant select, insert, update, delete on public.users to authenticated;
grant all on public.users to service_role;

grant select, insert, update, delete on public.workspace_themes to authenticated;
grant select on public.workspace_themes to anon; -- public job board theming
grant all on public.workspace_themes to service_role;

grant select, insert, update, delete on public.candidates to authenticated;
grant insert on public.candidates to anon; -- public apply form
grant all on public.candidates to service_role;

grant select, insert, update, delete on public.jobs to authenticated;
grant select on public.jobs to anon; -- public job board
grant all on public.jobs to service_role;

grant select, insert, update, delete on public.applications to authenticated;
grant insert on public.applications to anon; -- public apply form
grant all on public.applications to service_role;

grant select, insert, update, delete on public.interviews to authenticated;
grant all on public.interviews to service_role;

grant select, insert, update, delete on public.offers to authenticated;
grant all on public.offers to service_role;

grant select, insert, update, delete on public.activity_log to authenticated;
grant all on public.activity_log to service_role;

-- =========================================================
-- RLS
-- =========================================================
alter table public.workspaces enable row level security;
alter table public.users enable row level security;
alter table public.workspace_themes enable row level security;
alter table public.candidates enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.interviews enable row level security;
alter table public.offers enable row level security;
alter table public.activity_log enable row level security;

-- workspaces
create policy "workspaces: members can read own"
  on public.workspaces for select to authenticated
  using (id = public.current_workspace_id());
create policy "workspaces: anyone can read by slug"
  on public.workspaces for select to anon
  using (true);
create policy "workspaces: any authed user can create"
  on public.workspaces for insert to authenticated
  with check (owner_id = auth.uid());
create policy "workspaces: owner can update"
  on public.workspaces for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- users (profiles)
create policy "users: read self workspace members"
  on public.users for select to authenticated
  using (workspace_id = public.current_workspace_id() or id = auth.uid());
create policy "users: insert own profile"
  on public.users for insert to authenticated
  with check (id = auth.uid());
create policy "users: update self"
  on public.users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- generic per-workspace policies macro pattern
create policy "themes ws read" on public.workspace_themes for select to authenticated
  using (workspace_id = public.current_workspace_id());
create policy "themes public read" on public.workspace_themes for select to anon using (true);
create policy "themes ws write" on public.workspace_themes for all to authenticated
  using (workspace_id = public.current_workspace_id())
  with check (workspace_id = public.current_workspace_id());

create policy "candidates ws read" on public.candidates for select to authenticated
  using (workspace_id = public.current_workspace_id());
create policy "candidates ws write" on public.candidates for all to authenticated
  using (workspace_id = public.current_workspace_id())
  with check (workspace_id = public.current_workspace_id());
create policy "candidates public insert" on public.candidates for insert to anon with check (true);

create policy "jobs ws read" on public.jobs for select to authenticated
  using (workspace_id = public.current_workspace_id());
create policy "jobs public read" on public.jobs for select to anon using (status = 'open');
create policy "jobs ws write" on public.jobs for all to authenticated
  using (workspace_id = public.current_workspace_id())
  with check (workspace_id = public.current_workspace_id());

create policy "apps ws read" on public.applications for select to authenticated
  using (workspace_id = public.current_workspace_id());
create policy "apps ws write" on public.applications for all to authenticated
  using (workspace_id = public.current_workspace_id())
  with check (workspace_id = public.current_workspace_id());
create policy "apps public insert" on public.applications for insert to anon with check (true);

create policy "interviews ws read" on public.interviews for select to authenticated
  using (workspace_id = public.current_workspace_id());
create policy "interviews ws write" on public.interviews for all to authenticated
  using (workspace_id = public.current_workspace_id())
  with check (workspace_id = public.current_workspace_id());

create policy "offers ws read" on public.offers for select to authenticated
  using (workspace_id = public.current_workspace_id());
create policy "offers ws write" on public.offers for all to authenticated
  using (workspace_id = public.current_workspace_id())
  with check (workspace_id = public.current_workspace_id());

create policy "activity ws read" on public.activity_log for select to authenticated
  using (workspace_id = public.current_workspace_id());
create policy "activity ws insert" on public.activity_log for insert to authenticated
  with check (workspace_id = public.current_workspace_id());

-- realtime
alter publication supabase_realtime add table public.activity_log;
