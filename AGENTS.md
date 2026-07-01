# AGENTS.md

## Cursor Cloud specific instructions

This repo is **The Climate Note** — a single web app: React + TypeScript + Vite + Tailwind, with a Supabase backend and a Capacitor iOS wrapper. Dependencies install via `npm install` (already run on startup by the update script).

### Services / commands
There is one runnable service (the Vite web dev server). Standard commands live in `package.json` and `README.md`; key ones:
- Dev server: `npm run dev` → http://localhost:5173 (binds all interfaces, port 5173).
- Lint: `npm run lint` (ESLint; currently emits warnings but exits 0).
- Test: `npm run test` (Vitest, jsdom).
- Build: `npm run build` (plain Vite build; `npm run build:prod` additionally runs `scripts/validate-production-env.mjs` which requires real Supabase env vars).

### Non-obvious caveats
- **No `.env` needed to run/preview.** With no (or placeholder) Supabase env vars, the app renders an interactive **Demo Mode** in dev (`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` unset → `import.meta.env.DEV` shows `DemoMode`). This is the easiest "hello world": load the page and navigate Today/Notebook/Archive/About.
- **Build needs env vars set** or the app boots into Demo Mode. To build like CI, pass placeholders: `VITE_SUPABASE_URL=https://placeholder.supabase.co VITE_SUPABASE_ANON_KEY=placeholder-key VITE_APP_URL=https://theclimatenote.com npm run build`.
- Full authenticated functionality (login, notes, leaderboard, AI insights) requires a real Supabase project + edge function secrets (see `OAUTH_SETUP_GUIDE.md`, `ARTICLE_SCHEDULING_SETUP.md`, `.env.example`). Not required for local dev/testing of the UI.
- iOS build steps (`npm run ios:build`, Capacitor sync) require macOS + Xcode and cannot run in this Linux VM.
