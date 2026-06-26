# App Store Submission — Step-by-Step (Do Not Skip)

This checklist covers everything **you** must do outside the codebase. Code fixes for icons, CORS, deploy workflow, legal URLs, and production build validation are already in the repo.

---

## Phase 1: Backend & secrets (1–2 hours)

### 1.1 Supabase production secrets

In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Edge Functions → Secrets**, set:

| Secret | Required |
|--------|----------|
| `GEMINI_API_KEY` | Yes — AI insights & suggestions |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-available to edge functions |
| `ALLOWED_ORIGINS` | `https://theclimatenote.com,https://www.theclimatenote.com,capacitor://localhost,ionic://localhost` |

### 1.2 GitHub Actions deploy secret

In GitHub → **Settings → Secrets → Actions**, ensure:

| Secret | Value |
|--------|-------|
| `SUPABASE_PROJECT_REF` | `noefayakyrmmknqlcklf` |
| `SUPABASE_ACCESS_TOKEN` | Your Supabase personal access token (note: **single** underscore, not `__`) |

Push to `main` or run **Deploy Supabase Edge Functions** workflow manually to deploy all 5 functions.

### 1.3 Publish today’s article

Reviewers need content on first launch. In Supabase, confirm at least one **published** article exists for today’s date (or run `auto-publish-articles`).

### 1.4 Demo account for Apple reviewers

Create a real account Apple can use:

- Email: e.g. `appstore.review@theclimatenote.app` (or a Gmail you control)
- Password: strong, documented in App Store Connect **App Review Information**
- Pre-seed: read at least one article, one note, visible streak — so the app doesn’t look empty

---

## Phase 2: Legal pages live (30 min)

### 2.1 Enable GitHub Pages

1. GitHub repo → **Settings → Pages**
2. Source: **Deploy from branch** → `main` → folder **`/docs`**
3. Wait for deploy (~2 min)

### 2.2 Verify URLs open in a browser

- https://yasho1225.github.io/climatenote/privacy
- https://yasho1225.github.io/climatenote/terms

If 404, check Jekyll permalinks or add `permalink: /privacy` to front matter in `docs/privacy.md`.

### 2.3 Support email

Ensure `support@theclimatenote.app` receives mail (or update `src/lib/legalLinks.ts` to an address you monitor).

---

## Phase 3: Apple Developer setup (1–2 hours, requires Mac + Apple Developer account)

### 3.1 App ID & capabilities

In [Apple Developer](https://developer.apple.com/account):

1. **Identifiers** → App ID `com.theclimatenote.app`
2. Enable: **Sign in with Apple**
3. (Optional) Push Notifications — **only if you add remote push later**; app uses **local** reminders only

### 3.2 Sign in with Apple (Supabase)

Follow `OAUTH_SETUP_GUIDE.md`:

1. Apple: Services ID, Key (.p8), Team ID, Key ID
2. Supabase → **Authentication → Providers → Apple** — enable and paste credentials
3. Redirect URL in Apple: `https://noefayakyrmmknqlcklf.supabase.co/auth/v1/callback`
4. **Calendar reminder:** rotate Apple `.p8` key every **6 months**

### 3.3 Google Sign-In (if keeping it)

Supabase → Google provider enabled with OAuth client IDs for iOS + web.

---

## Phase 4: Production iOS build (on a Mac)

### 4.1 Configure `.env` (never commit this file)

```bash
cp .env.example .env
```

Fill in real values:

```env
VITE_SUPABASE_URL=https://noefayakyrmmknqlcklf.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon key>
# Optional for iOS-only (native OAuth uses com.theclimatenote.app://)
# VITE_APP_URL=https://theclimatenote.com
```

### 4.2 Generate icons (if not already done)

```bash
npm install
npm run icons:generate
```

Icons are written to `ios/App/App/Assets.xcassets/AppIcon.appiconset/`.

### 4.3 Build & open Xcode

```bash
npm run ios:build
```

This runs production env validation, builds the web app, syncs Capacitor, and opens Xcode.

### 4.4 Xcode checklist

1. **Signing & Capabilities** → your Team, bundle `com.theclimatenote.app`
2. Confirm **Sign in with Apple** capability (uses `App.entitlements`)
3. In `ios/App` folder: `pod install` if needed
4. **Product → Archive** → **Distribute App** → App Store Connect

---

## Phase 5: App Store Connect (1–2 hours)

### 5.1 App information

| Field | Suggested value |
|-------|-----------------|
| Name | The Climate Note |
| Subtitle | Daily climate stories & action |
| Category | Health & Fitness or Education |
| Age rating | Complete questionnaire — UGC (community notes) → likely **12+**; mention reporting via in-app email |

### 5.2 Privacy questionnaire (must match app behavior)

Declare data you collect:

| Data type | Linked to user | Purpose |
|-----------|----------------|---------|
| Email | Yes | Account |
| User content (notes, reactions) | Yes | App functionality |
| User content sent to AI (Gemini) | Yes | App functionality — disclose third-party processing |

- **Tracking:** No
- **Third-party SDKs:** Supabase, Google Gemini (AI), Apple/Google (sign-in only if used)

Match `ios/App/App/PrivacyInfo.xcprivacy`.

### 5.3 URLs in Connect

| Field | URL |
|-------|-----|
| Privacy Policy | https://yasho1225.github.io/climatenote/privacy |
| Terms (if asked) | https://yasho1225.github.io/climatenote/terms |
| Support URL | GitHub issues or a simple support page |

### 5.4 Screenshots

Required sizes (use iPhone 6.7" and 6.5" at minimum):

1. Landing / sign-in
2. Today’s article
3. Note + streak
4. Impact / goals
5. Profile / settings

Use `docs/snapshots/` as reference; capture fresh from TestFlight build.

### 5.5 App Review notes (paste into Connect)

```
Demo account:
  Email: appstore.review@...
  Password: ...

How to test:
  1. Sign in with demo account (or Sign in with Apple).
  2. Read today's article on Home tab.
  3. Add a climate action note — streak updates on Profile.
  4. Profile → Delete account (optional; use a throwaway account if testing deletion).

Account deletion: Profile → Danger zone → Delete account → type DELETE.

Sign in with Apple: offered alongside Google; required for apps with third-party login.

Community moderation: Community tab → tap a note → Report (submits to our moderation queue).
Users can also hide any other user's posts: tap note → Hide user.

No ads. No tracking. Local notification reminders only (user opts in via Settings).
```

---

## Phase 6: TestFlight smoke test (before submit)

On a **physical iPhone**, verify:

- [ ] Cold launch loads article (not connection error)
- [ ] Sign in with Apple works
- [ ] Sign in with Google works (if enabled)
- [ ] Email sign-up with terms checkbox
- [ ] Write a note; streak/level updates
- [ ] AI insights load (or graceful message if API down)
- [ ] Profile → open Privacy Policy & Terms (opens inside the app)
- [ ] Profile → enable reminder → iOS permission prompt appears **only when user toggles**
- [ ] Profile → Delete account (use throwaway account)
- [ ] No DemoMode, no blank icon, no crash on back navigation

---

## Phase 7: Submit for review

1. Upload build from Xcode Organizer
2. Select build in App Store Connect
3. Complete export compliance (already `ITSAppUsesNonExemptEncryption = false`)
4. **Submit for Review**

Typical review: 24–48 hours. Common rejection fixes:

| Rejection reason | Fix |
|------------------|-----|
| Guideline 5.1.1 — no account deletion | Already in app; mention in review notes |
| Guideline 4.8 — Sign in with Apple | Must work on device; Apple listed first on iOS |
| Guideline 2.1 — app incomplete | Ensure article + demo account work |
| Guideline 5.1.2 — privacy | Privacy URL must load; questionnaire must match Gemini |
| Guideline 1.2 — UGC | Mention report-via-email in review notes |

---

## Quick command reference

```bash
npm run icons:generate      # Regenerate iOS icons from app-icon.svg
npm run build:prod          # Production web build (validates .env)
npm run ios:build           # Prod build + cap sync + open Xcode
npm test                    # Run unit tests before release
```

---

## What we fixed in code (you don’t redo these)

- iOS app icon generator from `app-icon.svg`
- Deploy workflow `SUPABASE_ACCESS_TOKEN` typo
- CORS origins for Capacitor WebView
- Removed unused push-notification plugin (local notifications only)
- Removed missing `beep.wav` sound reference
- Legal URLs → `yasho1225.github.io/climatenote`
- Terms date aligned to March 22, 2026
- `armv7` → `arm64` in Info.plist
- DemoMode hidden outside dev builds
- `build:prod` / `ios:build` validate `.env` before shipping
