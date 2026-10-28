-- Statements are split on semicolons by scripts/db-load.ts.
-- Keep semicolons out of strings and function bodies.
drop table if exists messages;
drop table if exists leads;

create table leads (
  id text primary key,
  name text not null,
  company text not null,
  phone text not null,
  source text not null,
  rep text not null,
  product_interest text,
  last_contact_date date not null,
  follow_up_date date not null,
  tag text not null check (tag in ('Hot','Warm','Cold')),
  reason text not null,
  requested_date date,
  draft text,
  draft_sent_at timestamptz,
  assessed_at timestamptz not null,
  assessed_by text not null check (assessed_by in ('agent','rules')),
  agent_unavailable boolean not null default false
);

create table messages (
  id serial primary key,
  lead_id text not null references leads(id),
  sent_at timestamptz not null,
  sender text not null check (sender in ('rep','buyer')),
  sender_name text not null,
  text text not null
);

create index messages_lead_id_idx on messages(lead_id);
