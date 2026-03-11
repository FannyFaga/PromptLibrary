-- ─── Prompt Library — Supabase Schema ────────────────────────────────────────
--
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- It is safe to re-run: all statements use IF NOT EXISTS / OR REPLACE.

-- ─── Table ────────────────────────────────────────────────────────────────────
create table if not exists public.prompts (
  id         text        primary key default gen_random_uuid()::text,
  title      text        not null,
  category   text        not null default 'Other',
  tags       text[]      not null default '{}',
  text       text        not null,
  copy_count integer     not null default 0,
  created_at timestamptz not null default now(),
  edit_token text        not null default gen_random_uuid()::text
);

-- If the table already exists and is missing the edit_token column, add it:
alter table public.prompts add column if not exists
  edit_token text not null default gen_random_uuid()::text;

-- ─── Admin secret table ───────────────────────────────────────────────────────
-- Single-row table holding the admin secret. RLS is enabled with NO policies,
-- so the anon API key CANNOT read it. Only SECURITY DEFINER RPCs can.
--
-- ⚠️  CHANGE the default secret below to something only you know!
create table if not exists public.admin_secrets (
  id     integer primary key default 1 check (id = 1),   -- guarantees single row
  secret text    not null default 'CHANGE-ME-to-a-strong-secret'
);
alter table public.admin_secrets enable row level security;
-- No policies = completely inaccessible via the REST API.

-- Seed the single row (does nothing if it already exists)
insert into public.admin_secrets (id, secret)
values (1, 'CHANGE-ME-to-a-strong-secret')
on conflict (id) do nothing;

-- ─── RPC: verify admin secret ─────────────────────────────────────────────────
-- Returns true/false so the UI can confirm the entered secret is correct.
create or replace function public.verify_admin(p_token text)
returns boolean
language plpgsql
security definer
as $$
declare
  stored text;
begin
  select secret into stored from public.admin_secrets where id = 1;
  return stored is not null and p_token = stored;
end;
$$;

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.prompts enable row level security;

-- Everyone can read all prompts (public library)
drop policy if exists "Public read" on public.prompts;
create policy "Public read"
  on public.prompts for select
  using (true);

-- Everyone can submit a new prompt (no auth required)
drop policy if exists "Public insert" on public.prompts;
create policy "Public insert"
  on public.prompts for insert
  with check (
    -- Basic server-side validation: title and text must not be blank
    length(trim(title)) > 0 and
    length(trim(text))  > 0
  );

-- No direct UPDATE or DELETE via the client — all mutations go through
-- token-verified RPC functions below.  copy_count uses its own RPC.

-- ─── RPC: increment copy count ───────────────────────────────────────────────
create or replace function public.increment_copy_count(prompt_id text)
returns void
language sql
security definer
as $$
  update public.prompts
  set copy_count = copy_count + 1
  where id = prompt_id;
$$;

-- ─── RPC: update prompt (token-verified OR admin) ────────────────────────────
-- Succeeds when the caller provides a valid edit_token OR a valid admin secret.
drop function if exists public.update_prompt(text, text, text, text, text[], text);
create or replace function public.update_prompt(
  p_id          text,
  p_edit_token  text,
  p_title       text,
  p_category    text,
  p_tags        text[],
  p_text        text,
  p_admin_token text default ''
)
returns json
language plpgsql
security definer
as $$
declare
  result       json;
  admin_secret text;
  is_admin     boolean := false;
begin
  -- Check admin access
  if p_admin_token <> '' then
    select secret into admin_secret from public.admin_secrets where id = 1;
    is_admin := (admin_secret is not null and p_admin_token = admin_secret);
  end if;

  if is_admin then
    update public.prompts
    set title = p_title, category = p_category, tags = p_tags, text = p_text
    where id = p_id;
  else
    update public.prompts
    set title = p_title, category = p_category, tags = p_tags, text = p_text
    where id = p_id and edit_token = p_edit_token;
  end if;

  if not found then
    raise exception 'Invalid edit token or prompt not found';
  end if;

  select row_to_json(t) into result
  from (
    select id, title, category, tags, text, copy_count, created_at
    from public.prompts where id = p_id
  ) t;

  return result;
end;
$$;

-- ─── RPC: delete prompt (token-verified OR admin) ────────────────────────────
drop function if exists public.delete_prompt(text, text);
create or replace function public.delete_prompt(
  p_id          text,
  p_edit_token  text,
  p_admin_token text default ''
)
returns void
language plpgsql
security definer
as $$
declare
  admin_secret text;
  is_admin     boolean := false;
begin
  -- Check admin access
  if p_admin_token <> '' then
    select secret into admin_secret from public.admin_secrets where id = 1;
    is_admin := (admin_secret is not null and p_admin_token = admin_secret);
  end if;

  if is_admin then
    delete from public.prompts where id = p_id;
  else
    delete from public.prompts where id = p_id and edit_token = p_edit_token;
  end if;

  if not found then
    raise exception 'Invalid edit token or prompt not found';
  end if;
end;
$$;

-- ─── Index for fast category / created_at queries ────────────────────────────
create index if not exists prompts_category_idx   on public.prompts (category);
create index if not exists prompts_created_at_idx on public.prompts (created_at desc);
