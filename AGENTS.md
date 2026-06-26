# The Climate Note

React + TypeScript + Vite web app (also wrapped as an iOS app via Capacitor) backed by Supabase. See `README.md` for the canonical command list.

## Cursor Cloud specific instructions

### Services & how to run them
- This repo is a single frontend product. The only long-running service is the **Vite dev server**: `npm run dev` (serves at `http://localhost:5173`). Standard scripts (`lint`, `test`, `build`, `dev`) live in `package.json`.
- **No backend is required to boot the app.** When `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are absent (or set to the `https://placeholder.supabase.co` placeholder) in dev, `src/App.tsx` renders `DemoMode` — a fully self-contained preview (browse the daily article, Community Notebook, Archive, About). Use this for quick UI verification without any secrets.
- For **real functionality** (auth, writing notes, goals, leaderboard) you must supply a Supabase project: copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. AI features (note classification, suggestions, insights) additionally require Supabase Edge Functions + `GEMINI_API_KEY` configured in the Supabase dashboard (see `OAUTH_SETUP_GUIDE.md` / `ARTICLE_SCHEDULING_SETUP.md`).

### Gotchas
- `DemoMode` content lives inside a fixed-height mobile-app frame; some sections (e.g. article "Key Takeaways") may require scrolling within the inner container rather than the page.
- `npm run build:prod` runs `scripts/validate-production-env.mjs` first and will fail without valid production env vars — use plain `npm run build` for a local production-style build.
- The iOS targets (`npm run ios:build`, `cap` commands) require macOS + Xcode and cannot run in the Linux cloud VM.
- Lint passes with warnings only (`eslint .` reports ~29 warnings, 0 errors); a non-zero warning count is expected, not a failure.
