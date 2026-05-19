# Continuum — Google Play Store Listing (copy-paste ready)

Everything you need to fill in the Play Console listing. Just paste each block into the matching field.

---

## App details

**App name** (max 30 chars)
```
Continuum
```

**Short description** (max 80 chars — shown in search results)
```
Your travel HQ. Trips, expenses, loyalty status, and lounges in one place.
```

**Full description** (max 4000 chars — main listing page)
```
Continuum is the travel app for people who actually travel.

Forward any flight, hotel, or rental confirmation to your private trips@gocontinuum.app address and a complete trip card appears on your dashboard within seconds — segments parsed, dates extracted, confirmation numbers captured.

Snap a receipt with your phone camera and Continuum reads the merchant, amount, currency, and date automatically. Drag it onto a trip and it's filed; or build an expense report from any combination of trip-tagged and unassigned receipts.

CORE FEATURES

— Email-to-trip parsing
Forward any booking email and Continuum extracts every flight leg, hotel stay, and confirmation number. Works with airlines, hotels, OTAs, and rental car companies worldwide.

— Receipt capture
Tap the camera in the header to snap a receipt. OCR auto-fills the merchant, amount, and date. Forwarded PDFs to expenses@gocontinuum.app work the same way.

— Multi-currency expense splits
Add companions to your address book once. Split any tab — equal, exact, percent, or share — across multiple currencies, with FX baked in. Balances settle cleanly even on multi-leg trips that touched four currencies.

— Loyalty programs in one wallet
Link every airline, hotel, rental car, and credit card you carry. Continuum tracks status progress against the next tier, surfaces vouchers and free-night certs from your linked cards before they expire, and tells you which lounges you can enter at every airport you fly through.

— Lounges with terminal-aware filtering
Type any airport. Continuum surfaces every lounge you can access there based on your alliance status, premium-cabin ticket, and the credit cards in your wallet — including dedicated First-class lounges when you qualify, with the access path spelled out for each one.

— Expense reports
File a Reimbursement report for the bookkeeper or a Trip Cost report for yourself. Both export as a clean printable PDF with all line items, currency conversion, receipts inline, and category breakdown.

WHO IT'S FOR

If you take more than five trips a year, manage your own expenses, or chase status across more than two airline programs, Continuum saves you hours per trip. Built by a frequent flyer who got tired of cobbling together five different apps.

PRIVACY

Your trips, expenses, and loyalty data are stored privately under your account. We don't sell your data, run ads, or share information with third parties beyond what's needed to run the service (analytics, crash reports). Premium subscriptions are managed on the web at gocontinuum.app.
```

**App category**: Travel & Local

**App icon** (512×512 PNG): use `assets/icon-only.png` (export at 512px from `public/pwa-512x512.png`)

**Feature graphic** (1024×500 PNG): you'll need to design this — a banner with the Continuum wordmark on a dark background. Use Figma or Canva. Suggested copy: "Your travel HQ — trips, expenses, status."

**Phone screenshots** (1080×1920 minimum, 3–8 shots): take from a running emulator or your phone. Suggested shots, in order:
1. Dashboard with a featured trip and the "Vouchers & Free Nights" strip visible
2. A trip detail page showing day-by-day timeline (flights + hotels)
3. Expense inbox with a snapped receipt auto-filled
4. Expense Split modal with multi-currency balances
5. Loyalty programs page with status progress bars
6. Lounges page with terminal filter applied
7. Expense report viewer (the printable HTML view)
8. (Optional) Tour overlay with one of the mini-previews

---

## Privacy + compliance

**Privacy policy URL**
```
https://gocontinuum.app/privacy.html
```

**Support email**
```
nicholas.sh.li@gmail.com
```

**Website**
```
https://gocontinuum.app
```

---

## Content rating questionnaire (IARC)

Answer for **Travel & Local app, no in-app communication**:

- **Violence**: None
- **Sexual content**: None
- **Profanity**: None
- **Controlled substances** (alcohol/tobacco/drugs): None
- **Gambling**: None
- **User-generated content shared with others**: No (only with users you explicitly invite to a shared trip)
- **Personal information shared**: No
- **Location shared with other users**: No
- **Digital purchases**: No (subscription managed externally on web)
- **Unrestricted internet**: No

Expected rating: **Everyone**.

---

## Data safety form

Google requires you to declare every piece of data your app collects. Use these answers (they match what Continuum actually does):

### Data collection: YES
You collect data over the internet.

### Data is encrypted in transit: YES
(All Supabase API calls and your Vercel functions use HTTPS.)

### Users can request data deletion: YES
Direct them to email nicholas.sh.li@gmail.com — you can delete their Supabase rows manually.

### Data types collected (check each that applies):

**Personal info**
- ✅ Email address — for account creation, sign-in, optional, NOT shared, NOT for ads
- ❌ Name — not collected
- ❌ Phone number — not collected
- ❌ Address — not collected

**Financial info**
- ✅ User payment info — only if they upgrade to Premium (handled by Stripe on web, not in-app), required for that feature, NOT shared, NOT for ads
- ❌ Purchase history (in-app) — N/A

**Photos and videos**
- ✅ Photos — receipt photos snapped via camera, optional, used for app functionality (OCR + display), NOT shared, NOT for ads, processed on-device + sent to Anthropic API for OCR

**App activity**
- ✅ App interactions — collected by PostHog for analytics, optional (you can opt out via standard PostHog), NOT shared with third parties beyond the analytics provider
- ✅ In-app search history — same (PostHog autocapture)

**Device or other IDs**
- ✅ Device or other IDs — collected by Sentry for crash reports, used for app functionality (debugging), NOT shared with third parties beyond Sentry

**NOT COLLECTED** (uncheck everything else):
- ❌ Location (precise or approximate)
- ❌ Audio
- ❌ Files & docs (other than the receipt photos already declared)
- ❌ Calendar
- ❌ Contacts (the in-app split contacts list lives only in the user's own Supabase rows, not collected centrally)
- ❌ Health & fitness
- ❌ Messages
- ❌ Web browsing history

---

## Pricing & distribution

- **Pricing**: Free
- **In-app products**: None (Premium subscription managed externally on web → no Google Play Billing → no 15–30% cut)
- **Countries**: All countries (or restrict if you prefer)
- **Contains ads**: NO
- **Designed primarily for children**: NO
- **Target audience age**: 18+ (adults — most users are business travelers)

---

## Release notes (for v1.0)

```
Initial release.

Forward bookings to trips@gocontinuum.app to import them. Snap receipts with the camera. Track loyalty status, vouchers, and lounges across every airline and hotel program in one wallet. Build clean expense reports from any combination of trips and orphan receipts.
```

---

# iOS App Store listing (copy-paste ready)

Same product, different fields. Apple's character limits are tighter than
Google's so the subtitle and keywords are net-new; description reuses the
Play full description verbatim.

**App name** (max 30 chars)
```
Continuum
```

**Subtitle** (max 30 chars — shown under the app name in search & on the listing)
```
Trips, status, lounges, splits
```
30/30 chars. Matches the landing-page headline so brand voice carries.

**Promotional text** (max 170 chars — appears above the description; editable without resubmitting for review)
```
Forward any booking to your private inbox. Snap receipts with one tap. Track elite status, lounge access, and shared tabs across every program — in one place.
```
158/170 chars.

**Description** (max 4000 chars — main listing body)

Reuse the Play full description above verbatim. Apple has no Play-specific
references in it. (~2,100 chars, well under the limit.)

**Keywords** (max 100 chars TOTAL across all keywords, comma-separated, no spaces — Apple uses these for search ranking; do NOT repeat "Continuum" or "Travel" since those are already indexed via the app name and category)
```
itinerary,trip planner,airport lounge,expense,airline status,frequent flyer,miles,receipts,loyalty
```
99/100 chars.

**Support URL**
```
https://gocontinuum.app
```

**Marketing URL** (optional but recommended)
```
https://gocontinuum.app
```

**Privacy policy URL**
```
https://gocontinuum.app/privacy.html
```

**Primary category**: Travel
**Secondary category** (optional): Productivity

**Age Rating questionnaire**: answer "None" to every category — expected rating is **4+**.

---

## App Review Information (App Store Connect → version page → bottom)

**Sign-in required**: YES

**Demo account credentials** — paste exactly what you set up:
- Username: `[your +appreview Gmail alias]`
- Password: `[the password you chose]`

**Notes for reviewer** (max 4000 chars)
```
Continuum is a travel app for frequent flyers. The demo account above has
one sample trip ("Lisbon Spring Trip") with two flights and a hotel
preloaded so all core screens display real data.

To exercise key features:
- Dashboard tab: shows the countdown to the demo trip
- Trips tab: tap "Lisbon Spring Trip" to see the day-by-day itinerary
- Lounges tab: type any airport code (e.g. JFK, LIS) — surfaces lounges
  accessible based on the demo account's loyalty profile
- Expense Split tab: shows the Companions / Groups demo data

The web build at gocontinuum.app is the canonical app — the iOS shell is
a Capacitor wrapper around the same React codebase. No platform-specific
behavior beyond native camera + push.

Contact: nicholas.sh.li@gmail.com
```

---

## iOS-specific Info.plist permission strings (Apple Review will reject without these)

These match the strings already in [codemagic.yaml](codemagic.yaml) lines 80-82 — copy
verbatim into Xcode's Info.plist editor:

- `NSCameraUsageDescription` = "Continuum uses your camera to snap photos of receipts, so we can attach them to your expense reports."
- `NSPhotoLibraryUsageDescription` = "Continuum needs access to your photos so you can pick existing receipt images to attach to expenses."
- `NSPhotoLibraryAddUsageDescription` = "Continuum saves cropped or annotated receipt images back to your photo library when you tap Save."

---

## Screenshots — sizing

Apple requires AT LEAST one set of screenshots in the 6.7" iPhone size:
- **1290 × 2796** portrait (iPhone 14/15/16 Pro Max, iPhone 14/15/16 Plus)

Optionally also:
- **1320 × 2868** (iPhone 16 Pro Max — newest)
- **2064 × 2752** (iPad Pro 12.9" — only if you support iPad)

The existing `public/Platform*.jpeg` files are 945×2048 — too small. Either
retake on an iPhone Pro Max / Plus, or upscale to 1290×2796 with ffmpeg:
```bash
for f in public/Platform*.jpeg; do
  ffmpeg -y -i "$f" -vf scale=1290:2796 -q:v 2 "${f%.jpeg}-1290.jpeg"
done
```
(Apple does not check whether screenshots were upscaled — only that the
file dimensions match the slot.)
