# Continuum — Native App Build Notes

This repo is wired for **Capacitor 8** so the existing Vite + React web app can ship to the Google Play Store and Apple App Store as a native shell. The web build at gocontinuum.app is unchanged — every native code path falls back to the existing web implementation when running in a browser.

---

## What's already done (no action needed)

- Capacitor 8 + Android platform fully scaffolded
- `capacitor.config.ts` — bundle ID `app.gocontinuum.continuum`, dark theme splash + status bar
- Native camera flow wired (`src/utils/nativeCamera.js`) — receipt snap uses `Camera.getPhoto()` on native, falls back to file input on web
- Android hardware back-button handler — closes modals before exiting the app
- AndroidManifest permissions: CAMERA, READ_MEDIA_IMAGES, POST_NOTIFICATIONS
- Icons + splash for every Android density (using current 512px PWA icon as source — fine for v1, can swap to higher-res later)
- `android/app/build.gradle` pre-configured to load signing config from `android/key.properties` automatically
- npm scripts: `npm run cap:sync:android`, `cap:open:android`, `cap:run:android`, `cap:assets`, `android:setup-signing`, `android:build-aab`
- `.gitignore` excludes build artifacts and keystores
- Store listing copy, content rating answers, and data safety form responses pre-written in [STORE_LISTING.md](STORE_LISTING.md) — copy-paste into Play Console

---

## The 4 things only you can do

### 1. Install Android Studio (~30 min, mostly waiting)

https://developer.android.com/studio — comes bundled with the JBR (Java 21 runtime) Capacitor 8 needs. Walk through the setup wizard; let it install the Android SDK and an emulator. That's it — no further config.

### 2. Sign up for Google Play Console ($25, one-time)

https://play.google.com/console — pay the $25, give Google your name + ID for verification. Usually approved within 24 hours.

### 3. Generate signing keystore (run one command, ~2 min)

From the repo root, in PowerShell:

```powershell
npm run android:setup-signing
```

The script will:
1. Prompt for a keystore password (you choose it — write it down BEFORE you forget)
2. Prompt for your name + city + country code
3. Generate `~/keystores/continuum-release.keystore`
4. Write `android/key.properties` automatically (already gitignored)

**After it runs, do this immediately:**
- Save the password in 1Password / Bitwarden
- Copy `~/keystores/continuum-release.keystore` to a backup drive AND your password manager (as an attachment)

If you lose the keystore or password, you can never update the app on Play Store — you'd have to re-publish under a new bundle ID.

### 4. Build, upload, take screenshots

```powershell
# Build the signed AAB:
npm run android:build-aab
# Output: android\app\build\outputs\bundle\release\app-release.aab
```

Then in Play Console:

1. **Create app** → name "Continuum", category "Travel & Local", language English (US)
2. **Internal Testing** → "Create new release" → upload the `.aab` → save → review → start rollout
3. Add testers (yourself + your 11 users) by Gmail address → share the opt-in URL
4. **Open the app on a device or emulator and capture 3–8 screenshots** (Android Studio emulator: `Ctrl+S` to save screenshot). Suggested shots are listed in [STORE_LISTING.md](STORE_LISTING.md).
5. **Fill the store listing** by copy-pasting from [STORE_LISTING.md](STORE_LISTING.md):
   - App details (name, short description, full description)
   - Phone screenshots
   - App icon (512×512 from `assets/`)
   - Feature graphic (1024×500 banner — design in Canva or Figma)
   - Privacy policy URL, support email, website
   - **Content rating questionnaire** — answers in STORE_LISTING.md
   - **Data safety form** — answers in STORE_LISTING.md
   - Pricing (Free, no in-app products)
6. **Promote to Production** when Internal Testing is stable (1–3 day Google review)

---

## Workflow after first release

When you push web changes, sync them into the native shell:

```powershell
npm run cap:sync:android         # web build → android/
npm run android:build-aab        # produce signed AAB
```

Bump `versionCode` (integer, must increase) and `versionName` (string, what users see) in `android/app/build.gradle` before each release.

---

## iOS later (when you get a Mac)

When you have access to a Mac, the iOS path is parallel:

```bash
npm install @capacitor/ios
npx cap add ios
npm run cap:sync
npx cap open ios    # opens Xcode
```

You'll also need:
- **Sign in with Apple** capability (required by Apple since you have Google sign-in — Guideline 4.8) — wire it into the existing Supabase auth flow with `signInWithIdToken`
- An iOS-specific keystore (Apple distribution certificate + provisioning profile, both managed by Xcode + your Apple Developer Program account)

The native camera, back button, inline report viewer code already in this repo all work on iOS unchanged.

---

## Microsoft Store (bonus path — easiest of the three)

Microsoft accepts PWAs directly via **PWABuilder** (https://www.pwabuilder.com):

1. Paste in `https://gocontinuum.app`
2. PWABuilder generates a signed Microsoft Store package
3. Upload to Partner Center
4. Sign up for Microsoft Developer ($19 individual / $99 corporation, one-time)

No Capacitor build needed — wraps the live PWA URL. Review takes 1–3 days.

---

## iOS · App Store via Codemagic CI (no Mac required)

Apple still requires a macOS build host, but Codemagic rents one in the cloud and drives it from your iPad. End-to-end cost: **$99/yr** (Apple Developer Program). Codemagic's free tier (500 build min/month) handles ~30 iOS builds — plenty for a small project.

### One-time setup

1. **Apple Developer enrollment** — App Store on iPad → install **Apple Developer** app → enroll → $99 → wait ~24h.
2. **App Store Connect API key** — `appstoreconnect.apple.com` → Users and Access → Integrations → App Store Connect API → generate a key with **App Manager** access. Note the **Issuer ID** + **Key ID**, download the `.p8` file (one-time download — save it carefully).
3. **Create app record** — App Store Connect → Apps → `+` → New App → Bundle ID `app.gocontinuum.continuum` (must match `capacitor.config.ts`).
4. **Codemagic account** — `codemagic.io` → sign in with GitHub → authorize this repo.
5. **Codemagic integration** — Codemagic → Personal → Integrations → App Store Connect → Add new → paste Issuer ID + Key ID + upload the `.p8`. Use the reference name `app_store_connect` (matches `codemagic.yaml`).
6. **First build** — Codemagic auto-detects [`codemagic.yaml`](codemagic.yaml). Pick the `ios-release` workflow → Start build. ~15 min later the .ipa is in TestFlight.

### Every release after that

```
git push origin main
```

The `ios-release` workflow runs on every push to `main`, builds a fresh .ipa, auto-bumps the build number, and uploads to TestFlight. To submit for App Store review, change the publishing block in `codemagic.yaml`:

```yaml
publishing:
  app_store_connect:
    submit_to_testflight: true
    submit_to_app_store: true   # add this line for App Store submission
```

### Bumping marketing version (1.0 → 1.1)

The build number auto-increments per build. The marketing version (the `1.0` part shown to users) is set inside `ios/App/App/Info.plist` → `CFBundleShortVersionString`. Edit it on a Mac/cloud-Mac, OR add a Codemagic script step that runs `agvtool new-marketing-version 1.1` before the build.

### App Store metadata

Fill once in App Store Connect (web UI works fine on iPad):

- App Information → privacy policy URL: `https://gocontinuum.app/privacy.html`
- App Privacy → data-collection questionnaire (Continuum stores email + receipts in Supabase — disclose accordingly)
- Pricing → Free, all territories
- 6.7" iPhone screenshots (1290 × 2796 portrait) — easiest to grab from the installed PWA on an iPhone simulator or the physical device
- Age Rating questionnaire
- Submit for Review

### iOS permission usage strings (auto-applied by CI)

Apple App Store Review Guideline 5.1.1 rejects apps that call camera or photo-library APIs without a clear, user-facing reason in `Info.plist`. These keys are PATCHED INTO `ios/App/App/Info.plist` automatically by the `codemagic.yaml` step "Patch Info.plist with permission usage descriptions" — you should never need to edit them manually unless you want to tweak the wording.

Current values (edit in `codemagic.yaml`, then push):

- **NSCameraUsageDescription** — "Continuum uses your camera to snap photos of receipts, so we can attach them to your expense reports."
- **NSPhotoLibraryUsageDescription** — "Continuum needs access to your photos so you can pick existing receipt images to attach to expenses."
- **NSPhotoLibraryAddUsageDescription** — "Continuum saves cropped or annotated receipt images back to your photo library when you tap Save."

If you add new Capacitor plugins (e.g. `@capacitor/geolocation`, `@capacitor/contacts`, `@capacitor/push-notifications`), add the corresponding `NSXxxUsageDescription` key to the same `set_str` block in `codemagic.yaml` BEFORE deploying — otherwise the app will crash the first time it triggers that permission, and Apple Review will reject for missing strings.

### Troubleshooting

- **"No matching profiles found"** — Codemagic's `xcode-project use-profiles` step auto-creates and downloads them on first run. If it fails, check the App Store Connect API key has **App Manager** (not just "Developer") role.
- **"App Store Connect rejected build: duplicate build number"** — the `agvtool new-version` step in `codemagic.yaml` should handle this; if it's blank on first build (no prior builds to read from), the `|| echo 0` fallback kicks in.
- **iOS folder out of sync after dependency updates** — locally on a Mac, run `npx cap sync ios` and commit. Codemagic also runs sync every build, but if a Capacitor plugin adds new native code, you may need a manual `pod install` checked in.
