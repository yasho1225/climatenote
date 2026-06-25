# App Store Review — Resubmission Notes

Use this when replying to rejection **Submission ID: 4cecb7f8-96bd-4617-a918-42c4c0f8c0f2**.

---

## What we fixed in the new build

### Guideline 4 — Sign in inside the app
- **Sign in with Apple** uses the native iOS sheet (no Safari).
- **Google sign-in** uses Capacitor’s in-app browser (`SFSafariViewController`), not the external Safari app.
- **Email/password** sign-up and log-in are fully in-app.
- **Privacy & Terms** during sign-up open in-app screens, not Safari.

### Guideline 5.1.1(v) — Account deletion
- **Profile tab → Delete account** (menu item)
- **Profile tab → Danger zone → Delete account** (secondary entry)
- **Profile & account modal → Delete account…**
- Flow: tap Delete account → type `DELETE` → confirm → account and data removed via server.

---

## Paste into App Store Connect → Reply to App Review

```
Thank you for the feedback. We have updated build [NEW BUILD NUMBER] to address both items:

Guideline 4 — Sign in / registration:
• Sign in with Apple uses the native iOS authorization sheet (ASAuthorizationController).
• Google sign-in uses an in-app SFSafariViewController sheet via our Capacitor integration — users are not sent to the external Safari app.
• Email and password registration and login are completed entirely within the app UI.
• Legal links on the sign-up screen open in-app policy screens.

Guideline 5.1.1(v) — Account deletion:
• Signed-in users can delete their account from Profile → "Delete account" (also under Danger zone).
• Deletion is permanent (not deactivation). Users type DELETE to confirm.
• Our backend edge function removes user notes, goals, profile, and the auth user.

We have attached a screen recording on a physical iPhone demonstrating:
1) Sign in with the demo account
2) Profile → Delete account
3) Full deletion confirmation flow

Demo account:
Email: [YOUR_DEMO_EMAIL]
Password: [YOUR_DEMO_PASSWORD]
```

---

## Screen recording checklist (physical iPhone)

Record **2–3 minutes** showing:

1. Launch app → Get started → sign in (demo account or Apple)
2. Land on Home with today’s article
3. **Profile** tab (bottom nav)
4. Tap **Delete account** in the menu (red row)
5. Show confirmation screen — type `DELETE`
6. Tap **Permanently delete account** (use a throwaway test account if needed)

Upload the video to **App Store Connect → App Review Information → Notes** (or attach in your reply).

---

## Backend checklist (Supabase — before archiving IPA)

1. **Edge Function secrets** (Dashboard → Edge Functions → Secrets):
   - `GEMINI_API_KEY` — AI summaries work
   - `ALLOWED_ORIGINS` — include `capacitor://localhost`, `ionic://localhost` if needed

2. **Deploy functions** — GitHub Actions workflow `Deploy Supabase Edge Functions`:
   - Secret `SUPABASE_ACCESS_TOKEN` (single underscore)
   - Secret `SUPABASE_PROJECT_REF` = `noefayakyrmmknqlcklf`
   - Must include **`delete-account`**

3. **Publish today’s article** — Home must not show “No article for today”

4. **Demo account** for reviewers (email/password, with streak + at least one note)

---

## iOS archive (Mac)

1. `.env` with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
2. `npm run build:prod` → `npx cap sync ios` → `pod install` in `ios/App`
3. Xcode: **build number 2** (already set in project) → Archive → Upload
4. Never ship if launch shows Connection Error or Demo Mode

---

## Device QA (physical iPhone)

- [ ] Cold launch → today’s article (demo account)
- [ ] Sign in with Apple — native sheet, no Safari app
- [ ] Sign in with Google — in-app sheet only
- [ ] Email sign-up / login in-app
- [ ] Profile → Delete account → type DELETE → success (throwaway account)
- [ ] No “Supabase env vars” text if AI fails
- [ ] Notebook → Report → in-app sheet → Send report

---

## App Store Connect resubmission

1. Select **build 2** (or latest uploaded build)
2. Reply to rejection (template above)
3. **App Review Information:** demo credentials + screen recording
4. **App Privacy:** email, name, user content; Gemini AI processing; **no tracking**
5. **Age rating:** disclose user-generated content (community notes) → likely 12+
6. **Privacy Policy URL:** https://yasho1225.github.io/climatenote/privacy (must load)
7. Submit for review

---

## Before you resubmit (quick)

1. `npm run build:prod` with real `.env`
2. `npm run ios:build` on Mac → Archive → upload new build
3. Test Google + Apple sign-in on device — no external Safari
4. Test delete account with throwaway email account
