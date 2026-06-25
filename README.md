# The Climate Note

Daily climate stories and personal action notes — iOS app (Capacitor) + Supabase backend.

## Quick start

```bash
npm install
cp .env.example .env   # add Supabase URL + anon key
npm run dev            # web preview at http://localhost:5173
```

## iOS build (Mac required)

```bash
npm run icons:generate   # once, or after changing app-icon.svg
npm run ios:build        # validates .env, builds, syncs Capacitor, opens Xcode
```

Archive in Xcode → upload to App Store Connect.

**Full submission checklist:** see [`APP_STORE_SUBMISSION_STEPS.md`](APP_STORE_SUBMISSION_STEPS.md)

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local web dev server |
| `npm run build:prod` | Production web build (checks `.env`) |
| `npm run ios:build` | Prod build + Capacitor sync + Xcode |
| `npm run icons:generate` | iOS app icons from `app-icon.svg` |
| `npm test` | Unit tests |

## Docs

| File | Purpose |
|------|---------|
| `APP_STORE_SUBMISSION_STEPS.md` | App Store submission checklist |
| `OAUTH_SETUP_GUIDE.md` | Apple / Google sign-in setup |
| `ARTICLE_SCHEDULING_SETUP.md` | Daily article publishing |
| `docs/privacy.md` | Privacy policy (GitHub Pages) |
| `docs/terms.md` | Terms of service (GitHub Pages) |

## Environment

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_PRIVACY_URL=https://yasho1225.github.io/climatenote/privacy
VITE_TERMS_URL=https://yasho1225.github.io/climatenote/terms
```

## Stack

React · TypeScript · Tailwind · Supabase · Capacitor iOS
