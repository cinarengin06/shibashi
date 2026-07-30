create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public;

create table if not exists public.sync_accounts (
  account_id text primary key,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  code_hash text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sync_accounts_account_id_format check (
    account_id ~ '^[a-f0-9]{24}$' or
    account_id ~ '^u-[a-f0-9]{32}$'
  ),
  constraint sync_accounts_code_hash_format check (code_hash ~ '^[a-f0-9]{64}$'),
  constraint sync_accounts_payload_object check (jsonb_typeof(payload) = 'object')
);

create table if not exists public.profiles (
  account_id text primary key references public.sync_accounts(account_id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  auth_email text,
  display_name text,
  selected_shen_id text,
  selected_coach_id text,
  raw_profile jsonb not null default '{}'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.practice_sessions (
  account_id text not null references public.sync_accounts(account_id) on delete cascade,
  record_id text not null,
  occurred_at text,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (account_id, record_id)
);

create table if not exists public.journal_entries (
  account_id text not null references public.sync_accounts(account_id) on delete cascade,
  record_id text not null,
  occurred_at text,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (account_id, record_id)
);

create table if not exists public.posture_reports (
  account_id text not null references public.sync_accounts(account_id) on delete cascade,
  record_id text not null,
  occurred_at text,
  score numeric,
  analysis_source text,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (account_id, record_id)
);

create table if not exists public.shen_activities (
  account_id text not null references public.sync_accounts(account_id) on delete cascade,
  record_id text not null,
  shen_id text,
  activity_type text,
  occurred_at text,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (account_id, record_id)
);

create table if not exists public.reflections (
  account_id text not null references public.sync_accounts(account_id) on delete cascade,
  record_id text not null,
  shen_id text,
  occurred_at text,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (account_id, record_id)
);

create table if not exists public.saved_master_sentences (
  account_id text not null references public.sync_accounts(account_id) on delete cascade,
  record_id text not null,
  master_sentence_id text,
  occurred_at text,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (account_id, record_id)
);

create table if not exists public.completed_stories (
  account_id text not null references public.sync_accounts(account_id) on delete cascade,
  story_id text not null,
  completed_at timestamptz not null default now(),
  primary key (account_id, story_id)
);

create index if not exists practice_sessions_account_time_idx
  on public.practice_sessions (account_id, occurred_at desc);
create index if not exists journal_entries_account_time_idx
  on public.journal_entries (account_id, occurred_at desc);
create index if not exists posture_reports_account_time_idx
  on public.posture_reports (account_id, occurred_at desc);
create index if not exists shen_activities_account_time_idx
  on public.shen_activities (account_id, occurred_at desc);
create index if not exists reflections_account_time_idx
  on public.reflections (account_id, occurred_at desc);
create index if not exists profiles_auth_user_idx
  on public.profiles (auth_user_id);

alter table public.sync_accounts enable row level security;
alter table public.profiles enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.journal_entries enable row level security;
alter table public.posture_reports enable row level security;
alter table public.shen_activities enable row level security;
alter table public.reflections enable row level security;
alter table public.saved_master_sentences enable row level security;
alter table public.completed_stories enable row level security;

revoke all on table public.sync_accounts from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.practice_sessions from anon, authenticated;
revoke all on table public.journal_entries from anon, authenticated;
revoke all on table public.posture_reports from anon, authenticated;
revoke all on table public.shen_activities from anon, authenticated;
revoke all on table public.reflections from anon, authenticated;
revoke all on table public.saved_master_sentences from anon, authenticated;
revoke all on table public.completed_stories from anon, authenticated;

create or replace function public.shibashi_record_key(value jsonb)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select coalesce(
    nullif(value ->> 'id', ''),
    nullif(value ->> 'date', ''),
    nullif(value ->> 'createdAt', ''),
    nullif(value ->> 'savedAt', ''),
    md5(value::text)
  )
$$;

create or replace function public.shibashi_merge_record_arrays(
  first_records jsonb,
  second_records jsonb
)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  with combined as (
    select value, 0 as source_order, ordinality as item_order
    from jsonb_array_elements(
      case when jsonb_typeof(first_records) = 'array' then first_records else '[]'::jsonb end
    ) with ordinality
    union all
    select value, 1 as source_order, ordinality as item_order
    from jsonb_array_elements(
      case when jsonb_typeof(second_records) = 'array' then second_records else '[]'::jsonb end
    ) with ordinality
  ),
  deduplicated as (
    select distinct on (public.shibashi_record_key(value)) value
    from combined
    order by public.shibashi_record_key(value), source_order desc, item_order desc
  )
  select coalesce(
    jsonb_agg(
      value
      order by coalesce(
        value ->> 'date',
        value ->> 'createdAt',
        value ->> 'savedAt',
        ''
      ) desc
    ),
    '[]'::jsonb
  )
  from deduplicated
$$;

create or replace function public.shibashi_merge_payloads(
  server_payload jsonb,
  client_payload jsonb
)
returns jsonb
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  server_value jsonb := coalesce(server_payload, '{}'::jsonb);
  client_value jsonb := coalesce(client_payload, '{}'::jsonb);
  server_history jsonb := coalesce(server_value -> 'history', '{}'::jsonb);
  client_history jsonb := coalesce(client_value -> 'history', '{}'::jsonb);
  server_journey jsonb := coalesce(server_value -> 'journey', '{}'::jsonb);
  client_journey jsonb := coalesce(client_value -> 'journey', '{}'::jsonb);
  client_is_newer boolean :=
    coalesce(client_value ->> 'updatedAt', '') >=
    coalesce(server_value ->> 'updatedAt', '');
  merged_profile jsonb;
  merged_preferences jsonb;
begin
  if client_is_newer then
    merged_profile :=
      coalesce(server_value -> 'profile', '{}'::jsonb) ||
      coalesce(client_value -> 'profile', '{}'::jsonb);
    merged_preferences :=
      coalesce(server_value -> 'preferences', '{}'::jsonb) ||
      coalesce(client_value -> 'preferences', '{}'::jsonb);
  else
    merged_profile :=
      coalesce(client_value -> 'profile', '{}'::jsonb) ||
      coalesce(server_value -> 'profile', '{}'::jsonb);
    merged_preferences :=
      coalesce(client_value -> 'preferences', '{}'::jsonb) ||
      coalesce(server_value -> 'preferences', '{}'::jsonb);
  end if;

  return jsonb_build_object(
    'schemaVersion', 1,
    'updatedAt', to_char(
      timezone('utc', statement_timestamp()),
      'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
    ),
    'profile', merged_profile,
    'history', jsonb_build_object(
      'sessions', public.shibashi_merge_record_arrays(
        server_history -> 'sessions',
        client_history -> 'sessions'
      ),
      'entries', public.shibashi_merge_record_arrays(
        server_history -> 'entries',
        client_history -> 'entries'
      ),
      'postureReports', public.shibashi_merge_record_arrays(
        server_history -> 'postureReports',
        client_history -> 'postureReports'
      )
    ),
    'journey', jsonb_build_object(
      'completedStories', (
        select coalesce(jsonb_agg(story order by story), '[]'::jsonb)
        from (
          select distinct story
          from jsonb_array_elements_text(
            case
              when jsonb_typeof(server_journey -> 'completedStories') = 'array'
                then server_journey -> 'completedStories'
              else '[]'::jsonb
            end ||
            case
              when jsonb_typeof(client_journey -> 'completedStories') = 'array'
                then client_journey -> 'completedStories'
              else '[]'::jsonb
            end
          ) as values(story)
        ) as stories
      ),
      'shenActivities', public.shibashi_merge_record_arrays(
        server_journey -> 'shenActivities',
        client_journey -> 'shenActivities'
      ),
      'reflections', public.shibashi_merge_record_arrays(
        server_journey -> 'reflections',
        client_journey -> 'reflections'
      ),
      'savedMasterSentences', public.shibashi_merge_record_arrays(
        server_journey -> 'savedMasterSentences',
        client_journey -> 'savedMasterSentences'
      )
    ),
    'preferences', merged_preferences
  );
end
$$;

create or replace function private.project_shibashi_sync_payload()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  record_value jsonb;
  record_id text;
  story_value text;
begin
  insert into public.profiles (
    account_id,
    auth_user_id,
    auth_email,
    display_name,
    selected_shen_id,
    selected_coach_id,
    raw_profile,
    preferences,
    updated_at
  )
  values (
    new.account_id,
    new.auth_user_id,
    new.payload #>> '{profile,authEmail}',
    coalesce(new.payload #>> '{profile,name}', new.payload #>> '{profile,displayName}'),
    new.payload #>> '{profile,selectedShenId}',
    new.payload #>> '{profile,selectedCoachId}',
    coalesce(new.payload -> 'profile', '{}'::jsonb),
    coalesce(new.payload -> 'preferences', '{}'::jsonb),
    now()
  )
  on conflict (account_id) do update set
    display_name = excluded.display_name,
    auth_user_id = excluded.auth_user_id,
    auth_email = excluded.auth_email,
    selected_shen_id = excluded.selected_shen_id,
    selected_coach_id = excluded.selected_coach_id,
    raw_profile = excluded.raw_profile,
    preferences = excluded.preferences,
    updated_at = excluded.updated_at;

  delete from public.practice_sessions where account_id = new.account_id;
  for record_value in
    select value from jsonb_array_elements(
      coalesce(new.payload #> '{history,sessions}', '[]'::jsonb)
    )
  loop
    record_id := public.shibashi_record_key(record_value);
    insert into public.practice_sessions (
      account_id, record_id, occurred_at, payload
    ) values (
      new.account_id,
      record_id,
      coalesce(record_value ->> 'date', record_value ->> 'createdAt'),
      record_value
    );
  end loop;

  delete from public.journal_entries where account_id = new.account_id;
  for record_value in
    select value from jsonb_array_elements(
      coalesce(new.payload #> '{history,entries}', '[]'::jsonb)
    )
  loop
    record_id := public.shibashi_record_key(record_value);
    insert into public.journal_entries (
      account_id, record_id, occurred_at, payload
    ) values (
      new.account_id,
      record_id,
      coalesce(record_value ->> 'date', record_value ->> 'createdAt'),
      record_value
    );
  end loop;

  delete from public.posture_reports where account_id = new.account_id;
  for record_value in
    select value from jsonb_array_elements(
      coalesce(new.payload #> '{history,postureReports}', '[]'::jsonb)
    )
  loop
    record_id := public.shibashi_record_key(record_value);
    insert into public.posture_reports (
      account_id,
      record_id,
      occurred_at,
      score,
      analysis_source,
      payload
    ) values (
      new.account_id,
      record_id,
      coalesce(record_value ->> 'date', record_value ->> 'createdAt'),
      case
        when jsonb_typeof(record_value -> 'score') = 'number'
          then (record_value ->> 'score')::numeric
        else null
      end,
      record_value ->> 'analysisSource',
      record_value
    );
  end loop;

  delete from public.shen_activities where account_id = new.account_id;
  for record_value in
    select value from jsonb_array_elements(
      coalesce(new.payload #> '{journey,shenActivities}', '[]'::jsonb)
    )
  loop
    record_id := public.shibashi_record_key(record_value);
    insert into public.shen_activities (
      account_id,
      record_id,
      shen_id,
      activity_type,
      occurred_at,
      payload
    ) values (
      new.account_id,
      record_id,
      record_value ->> 'shenId',
      record_value ->> 'type',
      record_value ->> 'createdAt',
      record_value
    );
  end loop;

  delete from public.reflections where account_id = new.account_id;
  for record_value in
    select value from jsonb_array_elements(
      coalesce(new.payload #> '{journey,reflections}', '[]'::jsonb)
    )
  loop
    record_id := public.shibashi_record_key(record_value);
    insert into public.reflections (
      account_id, record_id, shen_id, occurred_at, payload
    ) values (
      new.account_id,
      record_id,
      record_value ->> 'shenId',
      record_value ->> 'createdAt',
      record_value
    );
  end loop;

  delete from public.saved_master_sentences where account_id = new.account_id;
  for record_value in
    select value from jsonb_array_elements(
      coalesce(new.payload #> '{journey,savedMasterSentences}', '[]'::jsonb)
    )
  loop
    record_id := public.shibashi_record_key(record_value);
    insert into public.saved_master_sentences (
      account_id,
      record_id,
      master_sentence_id,
      occurred_at,
      payload
    ) values (
      new.account_id,
      record_id,
      record_value ->> 'masterSentenceId',
      record_value ->> 'savedAt',
      record_value
    );
  end loop;

  delete from public.completed_stories where account_id = new.account_id;
  for story_value in
    select value from jsonb_array_elements_text(
      coalesce(new.payload #> '{journey,completedStories}', '[]'::jsonb)
    )
  loop
    insert into public.completed_stories (account_id, story_id)
    values (new.account_id, story_value)
    on conflict do nothing;
  end loop;

  return new;
end
$$;

drop trigger if exists project_shibashi_sync_payload_trigger
  on public.sync_accounts;
create trigger project_shibashi_sync_payload_trigger
after insert or update of payload on public.sync_accounts
for each row execute function private.project_shibashi_sync_payload();

create or replace function private.sync_shibashi_state_impl(
  p_sync_code text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  normalized_code text := upper(trim(coalesce(p_sync_code, '')));
  requested_code_hash text;
  requested_account_id text;
  guest_account_id text;
  caller_user_id uuid := auth.uid();
  stored_code_hash text;
  stored_payload jsonb;
  merged_payload jsonb;
begin
  if normalized_code !~ '^[A-Z0-9]{4}(-[A-Z0-9]{4}){2}$' then
    raise exception 'Geçersiz eşleştirme kodu.'
      using errcode = '22023';
  end if;

  if jsonb_typeof(p_payload) <> 'object'
    or coalesce((p_payload ->> 'schemaVersion')::integer, 0) <> 1
    or jsonb_typeof(p_payload -> 'profile') <> 'object'
    or jsonb_typeof(p_payload -> 'history') <> 'object'
    or jsonb_typeof(p_payload -> 'journey') <> 'object'
  then
    raise exception 'Geçersiz senkronizasyon paketi.'
      using errcode = '22023';
  end if;

  requested_code_hash := encode(
    extensions.digest(normalized_code, 'sha256'),
    'hex'
  );
  guest_account_id := substring(requested_code_hash from 1 for 24);

  if caller_user_id is not null then
    select account_id
    into requested_account_id
    from public.sync_accounts
    where auth_user_id = caller_user_id;

    if requested_account_id is null then
      update public.sync_accounts
      set auth_user_id = caller_user_id,
          updated_at = now()
      where account_id = guest_account_id
        and code_hash = requested_code_hash
        and auth_user_id is null
      returning account_id into requested_account_id;
    end if;

    requested_account_id := coalesce(
      requested_account_id,
      'u-' || replace(caller_user_id::text, '-', '')
    );
  else
    requested_account_id := guest_account_id;
  end if;

  insert into public.sync_accounts (
    account_id,
    auth_user_id,
    code_hash,
    payload
  )
  values (
    requested_account_id,
    caller_user_id,
    requested_code_hash,
    p_payload
  )
  on conflict (account_id) do nothing;

  select code_hash, payload
  into stored_code_hash, stored_payload
  from public.sync_accounts
  where account_id = requested_account_id
  for update;

  if caller_user_id is null
    and stored_code_hash is distinct from requested_code_hash
  then
    raise exception 'Eşleştirme kodu doğrulanamadı.'
      using errcode = '28000';
  end if;

  merged_payload := public.shibashi_merge_payloads(
    stored_payload,
    p_payload
  );

  update public.sync_accounts
  set payload = merged_payload,
      updated_at = now()
  where account_id = requested_account_id;

  return merged_payload;
end
$$;

create or replace function public.sync_shibashi_state(
  p_sync_code text,
  p_payload jsonb
)
returns jsonb
language sql
set search_path = public, private, pg_temp
as $$
  select private.sync_shibashi_state_impl(p_sync_code, p_payload)
$$;

revoke all on function public.shibashi_record_key(jsonb) from public;
revoke all on function public.shibashi_merge_record_arrays(jsonb, jsonb) from public;
revoke all on function public.shibashi_merge_payloads(jsonb, jsonb) from public;
revoke all on function private.project_shibashi_sync_payload() from public;
revoke all on function private.sync_shibashi_state_impl(text, jsonb) from public;
revoke all on function public.sync_shibashi_state(text, jsonb) from public;

grant usage on schema private to anon, authenticated;
grant execute on function private.sync_shibashi_state_impl(text, jsonb)
  to anon, authenticated;
grant execute on function public.sync_shibashi_state(text, jsonb)
  to anon, authenticated;
