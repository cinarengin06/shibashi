# Shibashi Supabase

`migrations/202607300001_shibashi_sync.sql` creates the persistent sync
schema for Web and Mobile:

- `sync_accounts`
- `profiles`
- `practice_sessions`
- `journal_entries`
- `posture_reports`
- `shen_activities`
- `reflections`
- `saved_master_sentences`
- `completed_stories`

All tables have RLS enabled and are closed to `anon` and `authenticated`.
Clients exchange their state only through `sync_shibashi_state`, which
validates the 12-character pairing code and never exposes list access.

Apply the migration from the Supabase SQL Editor, or with a linked CLI:

```bash
npx supabase db push
```

## Google Auth

Web and Mobile use the same Supabase user identity. Enable Google under
**Authentication → Sign In / Providers → Google**, then add these redirect
URLs under **Authentication → URL Configuration**:

- `http://127.0.0.1:3005`
- `http://localhost:3005`
- `shibashi://auth/callback`

Google Cloud's authorized redirect URI is the Supabase callback:

```text
https://mkjiejbekabfxnwxebtu.supabase.co/auth/v1/callback
```

The Google client secret belongs only in the Supabase Dashboard. Do not add it
to Web or Mobile environment files.
