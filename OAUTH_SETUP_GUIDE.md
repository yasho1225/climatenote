# OAuth Setup Guide for The Climate Note

This guide will help you set up Google and Apple social authentication for your app.

## Prerequisites
- ✅ Apple Developer Account (you have this)
- ✅ Supabase project (you have this)
- ⬜ Google Cloud Console account (free - we'll create this)

---

## Part 1: Google OAuth Setup (~45 minutes)

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Project name: `The Climate Note`
4. Click "Create"

### Step 2: Configure OAuth Consent Screen

1. In left sidebar: **APIs & Services** → **OAuth consent screen**
2. Select **External** (for public users)
3. Click "Create"
4. Fill in:
   - **App name**: `The Climate Note`
   - **User support email**: [your email]
   - **App logo**: (optional - upload your logo)
   - **Application home page**: `https://yourdomain.com`
   - **Authorized domains**: Add your domain (e.g., `yourdomain.com`)
   - **Developer contact**: [your email]
5. Click "Save and Continue"
6. **Scopes**: Click "Add or Remove Scopes"
   - Select: `../auth/userinfo.email`
   - Select: `../auth/userinfo.profile`
   - Select: `openid`
7. Click "Update" → "Save and Continue"
8. **Test users**: Skip this (we want public access)
9. Click "Save and Continue"

### Step 3: Create OAuth Credentials

1. In left sidebar: **APIs & Services** → **Credentials**
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: **Web application**
4. Name: `The Climate Note Web`
5. **Authorized JavaScript origins**:
   - Click "Add URI"
   - Add: `https://[YOUR-SUPABASE-PROJECT-REF].supabase.co`
   - (Find this in Supabase Dashboard → Settings → API)
6. **Authorized redirect URIs**:
   - Click "Add URI"
   - Add: `https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback`
7. Click "Create"
8. **COPY THESE - YOU'LL NEED THEM:**
   - Client ID: `xxx.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-xxx`

### Step 4: Enable Google Provider in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Left sidebar: **Authentication** → **Providers**
4. Find **Google** in the list
5. Toggle it **ON**
6. Paste your Google credentials:
   - **Client ID**: [paste from Google Cloud Console]
   - **Client Secret**: [paste from Google Cloud Console]
7. Click "Save"

### Step 5: Test Google Login

1. Run your app locally or on staging
2. Click "Continue with Google"
3. You should see Google's sign-in page
4. After signing in, you'll be redirected back to your app

---

## Part 2: Apple Sign In Setup (~30 minutes)

### Step 1: Create App ID in Apple Developer

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. **Certificates, Identifiers & Profiles** → **Identifiers**
3. Click the **+** button
4. Select **App IDs** → Click "Continue"
5. Select **App** → Click "Continue"
6. Fill in:
   - **Description**: `The Climate Note`
   - **Bundle ID**: `com.theclimatenote.app` (or your existing bundle ID)
   - **Capabilities**: Check "Sign in with Apple"
7. Click "Continue" → "Register"

### Step 2: Create Service ID

1. Still in **Identifiers**, click **+** button again
2. Select **Services IDs** → Click "Continue"
3. Fill in:
   - **Description**: `The Climate Note Web`
   - **Identifier**: `com.theclimatenote.web` (must be different from App ID)
4. Click "Continue" → "Register"

### Step 3: Configure Service ID

1. Click on the Service ID you just created
2. Check **"Sign in with Apple"**
3. Click **"Configure"** next to it
4. **Primary App ID**: Select the App ID you created in Step 1
5. **Website URLs**:
   - **Domains and Subdomains**:
     - Add: `[YOUR-SUPABASE-PROJECT-REF].supabase.co`
     - (Find this in Supabase: Settings → API → Project URL, remove `https://`)
   - **Return URLs**:
     - Add: `https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback`
6. Click "Next" → "Done" → "Continue" → "Save"

### Step 4: Create Key for Apple Sign In

1. **Certificates, Identifiers & Profiles** → **Keys**
2. Click **+** button
3. **Key Name**: `The Climate Note Sign In Key`
4. Check **"Sign in with Apple"**
5. Click **"Configure"** next to it
6. **Primary App ID**: Select your App ID
7. Click "Save" → "Continue" → "Register"
8. **DOWNLOAD THE KEY FILE** - You can only do this once!
   - File will be named: `AuthKey_XXXXXXXXXX.p8`
9. **SAVE THESE VALUES:**
   - **Key ID**: (shown on screen after creating)
   - **Team ID**: (shown in top-right corner of Apple Developer Portal)

### Step 5: Enable Apple Provider in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. **Authentication** → **Providers**
4. Find **Apple** in the list
5. Toggle it **ON**
6. Fill in:
   - **Services ID**: `com.theclimatenote.web` (from Step 2)
   - **Secret Key (p8 file)**: Open the `.p8` file you downloaded, copy entire contents (including BEGIN/END lines)
   - **Key ID**: (from Step 4)
   - **Team ID**: (from Step 4)
7. **Authorized Client IDs** (required for the native iOS sheet): add the app's
   **bundle ID** `com.theclimatenote.app`. The native flow sends Apple's identity
   token to Supabase, and that token's audience is the bundle ID (not the Services
   ID). Without this, native sign-in fails with an "Unacceptable audience" error.
   The Services ID (web) and the bundle ID (native) coexist here — add both.
8. Click "Save"

> **Why two flows?** The website uses Apple's web OAuth redirect (Services ID +
> `.p8` secret). The iOS app uses the **native** Sign in with Apple sheet via the
> `@capacitor-community/apple-sign-in` plugin + `supabase.auth.signInWithIdToken`,
> because the web redirect cannot return to the native app. Both authenticate
> against this same Supabase Apple provider.

---

## Part 3: Update Your App Environment Variables

Add these to your `.env` file (no changes needed - already configured in code):

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_URL=https://yourdomain.com
```

---

## Part 4: Deploy and Test

### For Web App:
1. Deploy your updated code
2. Visit your live app
3. Try "Continue with Google" and "Sign in with Apple"
4. Both should redirect properly and create user accounts

### For iOS App (Capacitor):
The native Sign in with Apple sheet is already wired up in the repo:
- The `@capacitor-community/apple-sign-in` plugin is in `package.json`.
- The "Sign in with Apple" capability is committed via `ios/App/App/App.entitlements`
  and the project's `CODE_SIGN_ENTITLEMENTS` build setting.

To build and test:
1. `npm run build && npx cap sync ios && npx cap open ios`
2. In Xcode, confirm **Signing & Capabilities** shows "Sign in with Apple"
   (it should already be present from the committed entitlements).
3. Ensure the App ID `com.theclimatenote.app` has the "Sign in with Apple"
   capability enabled in the Apple Developer portal (Part 2, Step 1).
4. **Test on a real device signed into an Apple ID** (or a simulator signed into
   one — a fresh simulator with no Apple ID will error). Tapping "Sign in with
   Apple" should present the **native** sheet (Face ID/Touch ID), not a browser.

---

## Troubleshooting

### Google Login Issues:
- **"redirect_uri_mismatch"**: Double-check the redirect URI in Google Cloud Console matches exactly: `https://[PROJECT-REF].supabase.co/auth/v1/callback`
- **"Access blocked"**: Make sure OAuth consent screen is set to "External" and published
- **"Invalid client"**: Verify Client ID and Secret in Supabase match Google Cloud Console

### Apple Sign In Issues:
- **"invalid_client"** (web flow): Check Service ID matches exactly in Supabase
- **"invalid_grant"** (web flow): Verify .p8 key file content was copied completely (including BEGIN/END lines)
- **Domain not verified**: Make sure domain in Apple Developer matches Supabase project URL exactly
- **Key ID mismatch**: Double-check Key ID and Team ID in Supabase
- **"Unacceptable audience"** (native iOS): add the bundle ID `com.theclimatenote.app` to the Apple provider's **Authorized Client IDs** in Supabase (Part 2, Step 5).
- **"Nonce mismatch"** (native iOS): the raw/hashed nonce was swapped — the hashed nonce goes to Apple, the raw nonce to `signInWithIdToken` (handled in `src/lib/appleAuth.ts`).
- **Native sheet doesn't appear / errors immediately**: test on a real device or a simulator signed into an Apple ID; confirm the "Sign in with Apple" capability is present in Xcode.

### General Auth Issues:
- Check browser console for errors
- Check Supabase logs: Dashboard → Logs → Auth logs
- Ensure your app domain is added to Supabase: Settings → Authentication → Site URL
- Clear cookies and try in incognito mode

---

## Security Notes

🔒 **Never commit these to Git:**
- Google Client Secret
- Apple .p8 key file
- Supabase anon key (already in .env)

✅ **Already protected:**
- Your `.env` file is in `.gitignore`
- OAuth secrets are stored in Supabase (not in your code)

---

## Next Steps After Setup

Once both providers are working:
1. Test signup with Google
2. Test signup with Apple
3. Test login with existing accounts
4. Verify user profiles are created correctly
5. Test on mobile (if using Capacitor)

---

## Need Help?

If you get stuck:
1. Check Supabase Auth logs: Dashboard → Logs → Auth
2. Check browser console for errors
3. Verify all URLs match exactly (no trailing slashes)
4. Make sure OAuth consent screen is published (Google)
5. Confirm Service ID is configured (Apple)

Let me know when you've completed the setup and I'll help you test!
