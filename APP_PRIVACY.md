# Continuum — App Privacy Questionnaire (copy-paste ready)

Fill this out in App Store Connect → your app → **App Privacy**. Apple rejects
apps for inaccurate disclosures more often than for almost any other reason,
so the answers below were derived from an audit of the codebase and the
actual third-party services in use as of launch.

If you add new SDKs / services / data fields later, re-audit before
submitting an update. Apple is checking.

---

## Data Types YOU collect

For each "Yes" below, the disclosure trio is:
- **Linked to user**: yes/no
- **Used for tracking**: always **NO** for Continuum (we don't share with
  data brokers, don't combine with third-party data for ads, don't
  fingerprint). Apple's definition of "tracking" is narrow — first-party
  analytics like our PostHog setup does NOT count.
- **Purposes**: from the multi-select list (App Functionality, Analytics,
  Product Personalization, Developer Advertising, Third-Party Advertising,
  Other Purposes).

| Data type · subcategory | Collected | Linked | Tracking | Purposes |
|---|---|---|---|---|
| **Contact Info** · Name | ✅ Yes | ✅ Yes | ❌ No | App Functionality, Product Personalization |
| **Contact Info** · Email Address | ✅ Yes | ✅ Yes | ❌ No | App Functionality, Product Personalization |
| **Contact Info** · Phone Number | ❌ | — | — | — |
| **Contact Info** · Physical Address | ❌ | — | — | — |
| **Health & Fitness** (all) | ❌ | — | — | — |
| **Financial Info** · Payment Info | ❌ | — | — | — |
| **Financial Info** · Credit Info | ❌ | — | — | — |
| **Financial Info** · Other Financial Info | ❌ | — | — | — |
| **Location** · Precise Location | ❌ | — | — | — |
| **Location** · Coarse Location | ❌ | — | — | — |
| **Sensitive Info** (all) | ❌ | — | — | — |
| **Contacts** (auto-imported) | ❌ | — | — | — |
| **User Content** · Emails or Text Messages | ✅ Yes | ✅ Yes | ❌ No | App Functionality |
| **User Content** · Photos or Videos | ✅ Yes | ✅ Yes | ❌ No | App Functionality |
| **User Content** · Audio Data | ❌ | — | — | — |
| **User Content** · Gameplay Content | ❌ | — | — | — |
| **User Content** · Customer Support | ❌ | — | — | — |
| **User Content** · Other User Content | ✅ Yes | ✅ Yes | ❌ No | App Functionality |
| **Browsing History** | ❌ | — | — | — |
| **Search History** | ❌ | — | — | — |
| **Identifiers** · User ID | ✅ Yes | ✅ Yes | ❌ No | App Functionality, Analytics |
| **Identifiers** · Device ID | ❌ | — | — | — |
| **Purchases** · Purchase History | ❌ | — | — | — |
| **Usage Data** · Product Interaction | ✅ Yes | ✅ Yes | ❌ No | Analytics |
| **Usage Data** · Advertising Data | ❌ | — | — | — |
| **Usage Data** · Other Usage Data | ❌ | — | — | — |
| **Diagnostics** · Crash Data | ✅ Yes | ✅ Yes | ❌ No | App Functionality |
| **Diagnostics** · Performance Data | ✅ Yes | ✅ Yes | ❌ No | App Functionality |
| **Diagnostics** · Other Diagnostic Data | ❌ | — | — | — |
| **Other Data** | ❌ | — | — | — |

---

## Where each piece of data goes

This is the "why" Apple may quiz you on if Review pushes back. Keep this
handy when filling the form.

### Name (first / last)
- **Stored**: `user.user_metadata` in Supabase Auth.
- **Purposes**: Greeting on the dashboard ("Good morning, Nicholas"), `senderName` on forwarded expense report PDFs, "Shared by X" tags on trip-shares.
- **Third-party flow**: Sent to PostHog as a user property when we identify the user for analytics.
- **Linked to user**: yes (it's stored against the user_id).

### Email Address
- **Stored**: `auth.users.email` in Supabase.
- **Purposes**: Sign-in identity, password reset, magic-link, sharing trips with companions, `reply_to` on forwarded expense reports.
- **Third-party flow**: Sent to PostHog as a user property; included in Sentry crash events; used by Resend as `reply_to` on outbound emails.
- **Linked to user**: yes.

### User Content · Emails or Text Messages (forwarded itinerary content)
- **Stored**: `itineraries` table in Supabase — the raw email body of any message you forward to `trips@gocontinuum.app` or `expenses@gocontinuum.app`.
- **Purposes**: Parsing into structured trip/expense data via Anthropic Claude API. Display in the "booking inbox" until the user accepts the parsed result.
- **Third-party flow**: Email body and any attached PDFs/images are sent to **Anthropic Claude API** for AI parsing. Per Anthropic's API agreement, inputs are not retained for model training by default. The parsed JSON returns and is stored; the raw text is also kept so the user can review the source.
- **Linked to user**: yes (every itinerary row has `user_id`).

### User Content · Photos or Videos (receipt images)
- **Stored**: `expenses.receipt_image` in Supabase (base64-encoded data URLs).
- **Purposes**: Display in the expense detail view; embed in PDF expense reports.
- **Third-party flow**: Sent to **Anthropic Claude Vision** when the user uses "Snap Receipt" OCR. Per Anthropic's API agreement, inputs are not retained for model training.
- **Linked to user**: yes.

### User Content · Other User Content
Catch-all for: trip names, dates, destinations, flight numbers, hotel names, expense descriptions, expense notes, custom packing-list items, loyalty program account numbers, voucher titles, expense-split contact names and emails.
- **Stored**: spread across `trips`, `expenses`, `expense_reports`, `linked_accounts`, `user_vouchers`, `packing_lists`, `split_*` tables in Supabase.
- **Purposes**: Core app functionality — this IS the app.
- **Third-party flow**: Trip and expense data passes through Anthropic when the user uses AI parsing features (forwarding, drag-drop), but is otherwise first-party.
- **Linked to user**: yes.

### Identifiers · User ID
- **Stored**: `auth.users.id` in Supabase (UUID).
- **Purposes**: Database row ownership (every user-owned row has a `user_id` foreign key), sign-in session, identifying users in PostHog/Sentry for analytics and debugging.
- **Third-party flow**: Sent to **PostHog** (analytics) as the distinct ID; sent to **Sentry** (crash reporting) as the user identifier on every captured exception.
- **Linked to user**: yes (by definition).

### Usage Data · Product Interaction
- **Stored**: At **PostHog** (third-party analytics service); we do not store these events ourselves.
- **Purposes**: Understanding which features users engage with, funnel analysis, debugging "did this user actually take this action."
- **Third-party flow**: Anonymous events flow client-side directly to PostHog tagged with `user_id` and an email property. Session recording is enabled (PostHog free tier).
- **Linked to user**: yes (identified after sign-in; pre-signed-in events are anonymous).

### Diagnostics · Crash Data
- **Stored**: At **Sentry** (third-party error monitoring); we do not store these events ourselves.
- **Purposes**: Triaging app crashes, debugging frontend errors and backend API failures.
- **Third-party flow**: Frontend exceptions captured by Sentry browser SDK include `user.id` and `user.email`. Backend errors captured via the `withSentry` wrapper on Vercel functions include the request context.
- **Linked to user**: yes.

### Diagnostics · Performance Data
- **Stored**: At **Sentry** alongside crashes.
- **Purposes**: Identifying slow API calls, slow page loads.
- **Third-party flow**: same as Crash Data.
- **Linked to user**: yes.

---

## What we explicitly do NOT collect

Worth noting for your privacy policy and any Apple Review pushback:

- **Precise location** — never requested. Airports are typed by the user as IATA codes; flight tracking uses the airline + flight number, not device GPS.
- **Coarse location** — same.
- **Health and fitness** — not a health app.
- **Payment / financial data** — Continuum is free; no in-app purchases. Loyalty point balances and travel credits are tracked but they're not money — closer to "User Content" than "Financial Info".
- **Contacts** — when the user adds an expense-split companion, they type the email manually. We do NOT request access to the iOS Contacts database.
- **Photos / camera at install** — permissions are requested only when the user explicitly taps "Snap Receipt" or "Pick from library" (just-in-time, not on first launch).
- **IDFA / advertising identifier** — never requested. We have nothing to advertise.
- **Browsing or search history outside the app**.

---

## Third-party services (for the Privacy Policy + your records)

| Service | What goes there | Why |
|---|---|---|
| **Supabase** | All user data (Postgres + Auth + Storage) | Primary backend |
| **Vercel** | Request logs, function execution traces | Hosting |
| **Anthropic Claude API** | Forwarded email bodies, PDFs, receipt images (transient) | AI parsing for trips and receipts |
| **PostHog** | Analytics events with user_id + email | Product analytics |
| **Sentry** | Crash/error reports with user_id + email | Error monitoring |
| **Resend** | Recipient email + sender name/email + PDF attachment | Outbound transactional email (expense reports) |
| **Cloudflare Email Routing** | Inbound emails (transient) | Receiving forwards to `trips@` / `expenses@` |
| **Google Maps Places API** | City/hotel autocomplete queries | Place lookup (not persisted by us) |
| **Aerodatabox API** (if used) | Airport / flight number queries | Live flight status |
| **OpenWeather API** (if used) | Airport code lookups | Trip-day weather |
| **Google OAuth** (sign-in) | Email + user_id | Sign-in identity |
| **Apple Sign-in** | Email or relay address | Sign-in identity |

None of the above engage in tracking under Apple's definition (no combining with third-party data for ads, no data-broker sharing, no IDFA-style cross-site identification).

---

## Apple Review notes

If Apple Review asks any of the following, here are the answers:

> **"Why do you collect email addresses?"**
> Required for account creation (sign-in identity), password reset, magic-link sign-in, and so users can share trips with companions by email.

> **"You disclosed Photos or Videos — do you process them with any third party?"**
> Yes. When the user taps "Snap Receipt", the photo is sent to Anthropic's Claude Vision API for OCR (merchant, amount, date extraction). Anthropic's API agreement specifies inputs are not retained for model training. The original photo is stored in our Supabase database, linked to the expense.

> **"You said Emails or Text Messages — explain."**
> Users can forward any travel-related email to a personal `@gocontinuum.app` address. We parse the email to extract booking details (flights, hotels) using Anthropic Claude. Only emails the user explicitly forwards are processed; we don't read their inbox.

> **"Sign in with Apple support?"**
> Yes — implemented alongside Google sign-in and email/password.

> **"In-app account deletion?"**
> Yes — Settings → Account → Danger Zone → Delete Account. Requires typing "DELETE" to confirm. Server-side endpoint scrubs all user-owned tables and removes the auth user.
