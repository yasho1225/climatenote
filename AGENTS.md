# The Climate Note

React + TypeScript + Vite frontend (Capacitor iOS wrapper) backed entirely by Supabase
(Postgres, Auth, Storage, Edge Functions). There is no custom backend server — the
"backend" is a Supabase project (hosted in production, or the local Supabase CLI stack
for development).

## Cursor Cloud specific instructions

The startup update script only runs `npm ci`. Everything below is the non-obvious context
for running/testing this app in the cloud VM. Standard commands live in `package.json`
scripts and `README.md`; only the gotchas are documented here.

### Running the frontend
- `npm run dev` serves the Vite app at http://localhost:5173 (config in `vite.config.ts`).
- Lint / test / build: `npm run lint`, `npm test` (Vitest), `npm run build`. `npm run build`
  needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set (CI passes placeholders); see
  `.github/workflows/ci.yml`.
- Env vars are read from `.env` (gitignored; copy from `.env.example`). They are baked in at
  build time, so **restart `npm run dev` after editing `.env`**.
- Without valid Supabase env vars the app renders a static `DemoMode` preview (dev) or a
  connection-error screen — it cannot create accounts or save notes. Real functionality
  (sign up, write/save action notes, leaderboard, etc.) requires a live Supabase backend.

### Backend options
1. Hosted Supabase project: set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `.env`.
2. Local Supabase stack via the Supabase CLI (`supabase start`), which requires Docker.
   Get local URL + anon key from `supabase status`. Studio is at http://localhost:54323,
   email testing (Mailpit) at http://localhost:54324.

### Local Supabase gotchas (important — `supabase start`/`db reset` does NOT work cleanly)
- **Migration ordering bug:** `supabase/migrations/20250127*` files (article scheduling,
  impact tracking, leaderboard) sort *before* `20250919170417_lucky_base.sql`, which creates
  the `articles` table, and they also reference the `status`/`role` columns that are only
  added by *later* migrations (`add_writer_workflow`, security migrations). A clean
  filename-order apply therefore fails with `relation "articles" does not exist` /
  `column "role"/"status" does not exist`. To bring the schema up locally, apply the base
  `20250919*`/`20250922*` migrations first, then the rest, and re-run the three `20250127*`
  feature migrations last (after `status`/`role` exist). Do NOT "fix" the committed migration
  files unless that is the explicit task.
- **Tables are not auto-exposed to the Data API.** The current Supabase CLI defaults to NOT
  granting new tables to the `anon`/`authenticated`/`service_role` roles (see the
  `auto_expose_new_tables` note in `supabase/config.toml`), but the migrations assume the old
  auto-grant behavior. After applying migrations you must grant access, e.g.
  `GRANT ALL ON ALL TABLES/SEQUENCES/ROUTINES IN SCHEMA public TO anon, authenticated, service_role;`
  plus matching `ALTER DEFAULT PRIVILEGES`, otherwise REST calls return
  `permission denied for table ...` (HTTP 401). RLS still enforces row-level access.
- Local email confirmations are disabled (`auth.email.enable_confirmations = false`), so
  email/password sign-up logs in immediately — no inbox step needed for testing.
- Edge functions (AI insights, action suggestions, note classification, account deletion,
  auto-publish) need `supabase functions serve` and a `GEMINI_API_KEY`; core browsing and
  note-writing work without them.

### iOS
The Capacitor iOS build (`npm run ios:*`) requires macOS + Xcode and cannot run in this Linux
VM. Use the web app (`npm run dev`) for development and testing here.
