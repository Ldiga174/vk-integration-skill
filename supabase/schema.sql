create table external_account_identities (
  provider text not null,
  external_user_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (provider, external_user_id)
);

create table integration_credentials (
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  channel_id text not null,
  status text not null check (status in ('needs_sync','connected','error')),
  metadata jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  last_error text,
  primary key (user_id, platform, channel_id)
);

create table social_metrics (
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  channel_id text not null,
  period text not null,
  metrics jsonb not null,
  primary key (user_id, platform, channel_id, period)
);

alter table external_account_identities enable row level security;
alter table integration_credentials enable row level security;
alter table social_metrics enable row level security;

create policy "identity owner" on external_account_identities for select using (auth.uid() = user_id);
create policy "credential owner" on integration_credentials for select using (auth.uid() = user_id);
create policy "metrics owner" on social_metrics for select using (auth.uid() = user_id);
