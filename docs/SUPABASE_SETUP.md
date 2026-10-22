# MatchDay Cloud Sync — setup inside the "Picture Day Cal" Supabase project (~10 minutes)

> Public copy: the real login emails are replaced by OWNER_LOGIN_EMAIL / HELPER_LOGIN_EMAIL. Substitute your own when running the SQL; the real values live in the private Claude Project copy of this file.

Decision: MatchDay shares the existing **Picture Day Cal** project ($0 additional — no new project needed). All MatchDay tables are prefixed `md_` and photos live in their own `mdphotos` bucket, so nothing touches Picture Day Cal's own data. Access is locked to the MatchDay team login specifically.

## 1. Pick the two logins

Two shared logins (neither needs a real inbox):
- `OWNER_LOGIN_EMAIL` — you and Kelly's phones
- `HELPER_LOGIN_EMAIL` — temporary helpers (reset or delete this user after the season and every temp is locked out at once)

The SQL below already has these exact addresses baked in — paste and run as-is.

## 2. Run the setup SQL

Supabase dashboard → open **Picture Day Cal** → **SQL Editor** → New query → paste ALL of this → **Run**:

```sql
-- MatchDay tables (md_ prefix keeps them clear of everything else)
create table md_shoots (
  sync_key text primary key,
  name text,
  columns jsonb,
  created_at timestamptz default now()
);
create table md_subjects (
  shoot_key text not null,
  id text not null,
  first_name text,
  last_name text,
  extra jsonb,
  added boolean default false,
  handled boolean default false,
  deleted boolean default false,
  flag text default '',
  flag_ts bigint default 0,
  updated_at timestamptz,
  primary key (shoot_key, id)
);
create table md_status (
  shoot_key text not null,
  subject_id text not null,
  device_id text not null,
  state text,
  ts bigint,
  by_name text,
  primary key (shoot_key, subject_id, device_id)
);
create table md_captures (
  id text primary key,
  shoot_key text,
  subject_id text,
  taken_at text,
  device_id text,
  device_name text
);

-- lock MatchDay data to the two MatchDay logins ONLY
alter table md_shoots enable row level security;
alter table md_subjects enable row level security;
alter table md_status enable row level security;
alter table md_captures enable row level security;
create policy "md team" on md_shoots for all to authenticated
  using (auth.jwt()->>'email' in ('OWNER_LOGIN_EMAIL','HELPER_LOGIN_EMAIL'))
  with check (auth.jwt()->>'email' in ('OWNER_LOGIN_EMAIL','HELPER_LOGIN_EMAIL'));
create policy "md team" on md_subjects for all to authenticated
  using (auth.jwt()->>'email' in ('OWNER_LOGIN_EMAIL','HELPER_LOGIN_EMAIL'))
  with check (auth.jwt()->>'email' in ('OWNER_LOGIN_EMAIL','HELPER_LOGIN_EMAIL'));
create policy "md team" on md_status for all to authenticated
  using (auth.jwt()->>'email' in ('OWNER_LOGIN_EMAIL','HELPER_LOGIN_EMAIL'))
  with check (auth.jwt()->>'email' in ('OWNER_LOGIN_EMAIL','HELPER_LOGIN_EMAIL'));
create policy "md team" on md_captures for all to authenticated
  using (auth.jwt()->>'email' in ('OWNER_LOGIN_EMAIL','HELPER_LOGIN_EMAIL'))
  with check (auth.jwt()->>'email' in ('OWNER_LOGIN_EMAIL','HELPER_LOGIN_EMAIL'));

-- private photo bucket, same lock
insert into storage.buckets (id, name, public) values ('mdphotos', 'mdphotos', false);
create policy "md team photos" on storage.objects for all to authenticated
  using (bucket_id = 'mdphotos' and auth.jwt()->>'email' in ('OWNER_LOGIN_EMAIL','HELPER_LOGIN_EMAIL'))
  with check (bucket_id = 'mdphotos' and auth.jwt()->>'email' in ('OWNER_LOGIN_EMAIL','HELPER_LOGIN_EMAIL'));
```

Expect "Success. No rows returned."

## 3. Create the team login

Still in Picture Day Cal: **Authentication → Users → Add user → Create new user.** Do this TWICE — once for OWNER_LOGIN_EMAIL, once for HELPER_LOGIN_EMAIL — each with its own password, **Auto Confirm User** checked on both. Your phones sign in with the gmail address; temp helpers get HELPER_LOGIN_EMAIL.

(Leave Picture Day Cal's existing auth settings alone — MatchDay doesn't care whether public signups are on or off there, since its data is email-locked.)

## 4. Grab the two values for the app

**Project Settings → API** (Data API) in Picture Day Cal:
- **Project URL** (`https://….supabase.co`)
- **anon public key** (the long `eyJ…` string)

These are Picture Day Cal's — that's correct, MatchDay lives there now.

## 5. Connect the phones

One phone: MatchDay → gear → **Cloud Sync** card → paste URL + anon key, team email + password → **Connect** → "Cloud connected ✓".
Other phones: gear → **Scan setup from other phone** while the first phone shows **Share setup (QR)**; then type the password and Connect.

## Using it

- Photos upload in the background after each shutter whenever there's internet.
- **Cloud Sync now** (shoot → download icon) = full two-way sync: everyone's check-ins and photos land on every phone.
- No signal on site: QR huddles as usual; Cloud Sync reconciles when you're back in coverage — undos included.

## Housekeeping

Your Pro plan includes 100 GB storage, so photo space is a non-issue. To tidy after a season anyway: Storage → mdphotos → delete old shoot folders (named by sync key), and in SQL Editor: `delete from md_captures where shoot_key='…'; delete from md_status where shoot_key='…'; delete from md_subjects where shoot_key='…'; delete from md_shoots where sync_key='…';`. Local backup ZIPs remain the permanent archive.
