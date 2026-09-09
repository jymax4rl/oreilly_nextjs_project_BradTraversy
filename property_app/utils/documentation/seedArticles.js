/**
 * Ops knowledge-base seed articles for Isisel (`property_app`).
 * Content is derived from the live codebase — do not invent features here.
 *
 * Seed into Mongo via Documentation model (`seedKey` + SEED_VERSION).
 */

export const SEED_VERSION = "1.1.0-docs-1";

/** Sidebar category order (exact strings). */
export const CATEGORY_ORDER = [
  "Platform Overview",
  "Authentication & Users",
  "Properties & Listings",
  "Search & Discovery",
  "Bookings & Reservations",
  "Host Console",
  "Operations Console",
  "Payments",
  "Media & Cloudinary",
  "Maps & Location",
  "Emails & Notifications",
  "Database",
  "API & Backend",
  "Frontend Architecture",
  "Security",
  "Deployment & Infrastructure",
  "Troubleshooting",
  "Updates / Changelog",
  "Known Limitations",
  "Cleaning & Property Operations",
];

/**
 * @param {object} partial
 * @returns {object}
 */
function article(partial) {
  return {
    status: "active",
    relatedFeatures: [],
    relatedRoutes: [],
    relatedFiles: [],
    relatedModels: [],
    relatedApiEndpoints: [],
    tags: [],
    subcategory: "",
    featureStatus: "active",
    ...partial,
  };
}

export const SEED_ARTICLES = [
  article({
    slug: "platform-overview",
    title: "Isisel platform overview",
    category: "Platform Overview",
    subcategory: "Product",
    summary:
      "What Isisel is today: a Next.js short-stay marketplace for hosts and guests, with ops staff tools, manual WhatsApp-first booking, and selective online checkout.",
    tags: ["overview", "mvp", "isisel", "marketplace"],
    featureStatus: "active",
    relatedFeatures: [
      "Guest explore",
      "Host console",
      "Ops console",
      "Manual bookings",
    ],
    relatedRoutes: ["/", "/properties", "/host", "/ops", "/login"],
    relatedFiles: [
      "property_app/package.json",
      "property_app/VERSION",
      "property_app/app/layout.jsx",
      "property_app/docs/HANDOFF.md",
    ],
    relatedModels: ["User", "Property", "Booking"],
    relatedApiEndpoints: ["GET /api/health", "GET /api/health/db"],
    content: `## What

Isisel is a short-stay property marketplace built as a **Next.js App Router** application under \`property_app/\` (package version **1.1.0**). Guests discover listings, request stays, and coordinate payment with hosts. Verified hosts manage listings, calendars, and reservations. Ops staff run moderation, users, marketing, and support from \`/ops\`.

Live product URL: **https://www.isisel.com**.

## Why

The product goal is a lean African / diaspora-friendly stay marketplace: hosts list homes, guests reserve dates, and payment is collected in a way that fits local reality (WhatsApp + mobile money) while online rails exist for ops testing and future open checkout.

## Who

- **Guests** — Google sign-in; request reservations; messaging; my bookings.
- **Hosts** — Verified after onboarding; host console at \`/host\`.
- **Ops (\`admin\` / \`superadmin\`)** — Full console at \`/ops\`; legacy \`/admin\` redirects.
- **Creators / influencers** — Public funnel + host promo partnerships (see creators article).

## How

Typical guest path: browse (when catalog beta allows) → property page → pick dates → provide phone → **request reservation** → host confirms payment offline → stay confirmed.

Ops path: \`/ops/login\` (credentials) → overview, listings moderation, reservations, users, marketing.

## Business rules

- Public listing **catalog is beta-closed by default** (\`NEXT_PUBLIC_LISTINGS_CATALOG_BETA\`): only verified hosts and ops browse other hosts’ listings until launch.
- Guest **online MoMo/card checkout is ops-only** today; everyday guests use WhatsApp + manual payment with the host.
- Cleaning is a **15% fee on accommodation**, not a cleaner workforce product.
- New listings require **ops moderation** before public visibility.

## Technical implementation

- Stack: Next.js 16, React 19, MongoDB/Mongoose, NextAuth, Cloudinary, Resend, optional GeniusPay/Creem.
- Database name forced to \`KamaProperties\` in \`property_app/config/database.js\`.
- App routes live under \`property_app/app/\`; shared logic under \`property_app/utils/\`; schemas under \`property_app/models/\`.

## Troubleshooting

- Site up but data 500s → Atlas may be paused; check \`GET /api/health/db\`.
- Guests see empty catalog → expected in catalog beta; open with \`NEXT_PUBLIC_LISTINGS_CATALOG_BETA=false\`.
`,
  }),

  article({
    slug: "application-architecture",
    title: "Application architecture",
    category: "Frontend Architecture",
    subcategory: "Structure",
    summary:
      "How the Isisel Next.js app is layered: App Router pages, API routes, Mongoose models, utils services, middleware auth gates, and console shells.",
    tags: ["architecture", "nextjs", "app-router"],
    featureStatus: "active",
    relatedFeatures: ["Middleware", "Host shell", "Ops shell", "PWA chrome"],
    relatedRoutes: ["/", "/host", "/ops", "/api/*"],
    relatedFiles: [
      "property_app/middleware.js",
      "property_app/app/layout.jsx",
      "property_app/components/MainShell.jsx",
      "property_app/utils/exploreLayout.js",
      "property_app/utils/hostConsole.js",
    ],
    relatedModels: [],
    relatedApiEndpoints: [],
    content: `## What

Isisel is a **monolithic Next.js app** with server components, client islands, and Route Handlers under \`app/api\`. There is no separate backend service.

## Why

One deployable unit keeps marketplace, host tools, and ops tools in sync for an early-stage product.

## Who

Engineers and ops tech leads maintaining \`property_app/\`.

## How

| Layer | Location | Role |
|---|---|---|
| Pages / layouts | \`app/\` | UI routes (\`/host\`, \`/ops\`, \`/properties\`, …) |
| API | \`app/api/**/route.js\` | JSON + webhooks |
| Models | \`models/\` | Mongoose schemas |
| Domain logic | \`utils/\` | Bookings, availability, payments, email, creators |
| Components | \`components/\` | UI by domain (\`host/\`, \`ops/\`, \`bookings/\`) |
| Gates | \`middleware.js\` | Auth redirects for \`/ops\`, \`/admin\`, \`/host\`, add listing |

**Guest chrome:** explore-style mobile header + bottom tab bar via \`utils/exploreLayout.js\` (hidden on host/ops and add-listing).

**Host chrome:** \`HostNav\` top rail. **Ops chrome:** \`OpsNav\` side rail + mobile top bar.

## Business rules

- \`/ops/*\` requires ops staff JWT; \`/ops/login\` is the credentials entry.
- \`/host/*\` (except install / onboarding) requires \`hostStatus === "verified"\`.
- \`/admin\` is legacy; root redirects to \`/ops\`.

## Technical implementation

- Auth session strategy: **JWT** (\`utils/authOptions.js\`).
- Server actions exist for messaging (\`utils/actions/messageActions.js\`).
- PWA: \`app/manifest.js\`, push helpers under \`utils/push/\`.
- i18n: EN/FR via cookies + \`lib/i18n/\` and middleware locale apply.

## Troubleshooting

- Wrong shell (tab bar on host) → check \`isExploreMobileLayout\` / \`isHostWorkspacePath\`.
- Infinite redirect to login → missing \`NEXTAUTH_SECRET\` or cookie domain mismatch with \`NEXTAUTH_URL\`.
`,
  }),

  article({
    slug: "authentication-nextauth",
    title: "Authentication (NextAuth)",
    category: "Authentication & Users",
    subcategory: "Sign-in",
    summary:
      "Google OAuth for marketplace users; ops Credentials provider with bcrypt passwordHash; JWT sessions hydrated from Mongo User.",
    tags: ["nextauth", "google", "ops-login", "jwt"],
    featureStatus: "active",
    relatedFeatures: ["Google sign-in", "Ops credentials", "Ban checks"],
    relatedRoutes: ["/login", "/ops/login", "/api/auth/[...nextauth]"],
    relatedFiles: [
      "property_app/utils/authOptions.js",
      "property_app/utils/user/ensureMarketplaceUser.js",
      "property_app/app/api/auth/[...nextauth]/route.js",
      "property_app/scripts/set-ops-password.mjs",
    ],
    relatedModels: ["User"],
    relatedApiEndpoints: [
      "GET/POST /api/auth/[...nextauth]",
      "POST /api/ops/founder-bootstrap",
    ],
    content: `## What

Authentication uses **NextAuth v4** with two providers:

1. **Google** — guests and hosts (\`/login\`).
2. **Ops Credentials** (\`id: "ops-credentials"\`) — staff email + password for \`/ops/login\`.

Sessions use the **JWT strategy**. Tokens carry \`id\`, \`role\`, \`hostStatus\`, \`hasCompletedHostOnboarding\`, \`banned\`.

## Why

Marketplace users expect one-tap Google. Ops needs a locked-down password path separate from Google.

## Who

- Guests/hosts: Google only (no password field on User for them).
- Ops: \`passwordHash\` (bcrypt, \`select: false\`) set via \`npm run ops:set-password\`.

## How

1. Google callback → \`ensureMarketplaceUser\` upserts \`User\`.
2. Ops authorize → find user by email, require ops role + \`passwordHash\`, bcrypt compare, reject if \`banned\`.
3. \`jwt\` / \`session\` callbacks re-hydrate from Mongo on update or missing fields.
4. Banned users fail Google \`signIn\` and ops authorize.

## Business rules

- Only \`admin\` / \`superadmin\` may use ops credentials.
- Ban blocks new sign-in; existing JWTs expire naturally but hydrate re-checks \`banned\`.
- Founder bootstrap APIs exist under \`/api/ops/founder-*\` for first ops account flows (env-gated).

## Technical implementation

Key file: \`property_app/utils/authOptions.js\`. Env names: \`NEXTAUTH_URL\`, \`NEXTAUTH_SECRET\`, \`GOOGLE_CLIENT_ID\`, \`GOOGLE_CLIENT_SECRET\`.

Password script: \`OPS_PASSWORD=… npm run ops:set-password\` (optional \`OPS_EMAIL\`, \`OPS_PROMOTE\`, \`OPS_ROLE\`).

## Troubleshooting

- Google callback mismatch → must match \`NEXTAUTH_URL\` + \`/api/auth/callback/google\`.
- Ops login always fails → user not ops role, missing hash, or banned.
- Session missing role → force session \`update\` or re-login after DB role change.
`,
  }),

  article({
    slug: "user-roles",
    title: "User roles and host status",
    category: "Authentication & Users",
    subcategory: "Roles",
    summary:
      "User.role enum (guest, host, admin, superadmin) and hostStatus lifecycle (none → onboarding → verified | rejected).",
    tags: ["roles", "hostStatus", "permissions"],
    featureStatus: "active",
    relatedFeatures: ["Host onboarding", "Ops staff", "Bans"],
    relatedRoutes: ["/host/onboarding", "/host/pending", "/ops/users"],
    relatedFiles: [
      "property_app/models/User.js",
      "property_app/utils/opsAuth.js",
      "property_app/middleware.js",
      "property_app/app/api/host/onboarding/route.js",
    ],
    relatedModels: ["User", "HostApplication"],
    relatedApiEndpoints: [
      "POST /api/host/onboarding",
      "GET /api/ops/users",
      "PATCH /api/admin/users/[id]",
    ],
    content: `## What

Every account is a \`User\` document. Authorization combines:

- **\`role\`**: \`guest\` | \`host\` | \`admin\` | \`superadmin\` (default \`guest\`).
- **\`hostStatus\`**: \`none\` | \`onboarding\` | \`verified\` | \`rejected\`.

Ops helpers: \`isOpsStaff(role)\` → admin or superadmin; \`isSuperAdmin(role)\`.

## Why

Separating marketplace role from host verification lets someone be a guest while applying, and keeps ops tools off Google consumer accounts unless promoted.

## Who

Ops promote/verify hosts; middleware enforces host console access.

## How

- Apply at \`/host/onboarding\` → \`HostApplication\` + \`hostStatus: onboarding\` → \`/host/pending\`.
- Ops approve → \`hostStatus: verified\` (and typically \`role: host\`) → full \`/host\` console and \`/properties/add\`.
- Reject → \`rejected\`; user can see pending/onboarding flows per middleware.

## Business rules

- Unverified users cannot add listings (\`middleware\` redirects).
- \`banned\` is ops-only account block (see User schema).
- \`isTrainingGuest\` marks synthetic guests for ops calendar drills (excluded from analytics).
- Notification prefs live under \`User.preferences.notifications\`.

## Technical implementation

Schema: \`property_app/models/User.js\`. Ops role constants: \`property_app/utils/opsAuth.js\`.

Additional host fields: \`hostAddress\`, \`hostPayout\` (IBAN for future platform payouts), founding-host program fields, push subscriptions.

## Troubleshooting

- Verified in DB but redirected to onboarding → JWT stale; sign out/in or session update.
- Host role without verified status → console still blocked by middleware \`hostStatus\` check.
`,
  }),

  article({
    slug: "ops-access",
    title: "Ops access and documentation gate",
    category: "Security",
    subcategory: "Ops",
    summary:
      "How staff reach /ops, role checks in middleware, and the stricter email-domain gate for the internal documentation knowledge base.",
    tags: ["ops", "access-control", "documentation"],
    featureStatus: "active",
    relatedFeatures: ["Ops login", "Documentation ACL"],
    relatedRoutes: ["/ops", "/ops/login", "/documentation"],
    relatedFiles: [
      "property_app/middleware.js",
      "property_app/utils/opsAuth.js",
      "property_app/utils/documentation/access.js",
      "property_app/utils/documentation/requireOpsDocumentationPage.js",
      "property_app/utils/documentation/requireOpsDocumentationApi.js",
    ],
    relatedModels: ["User", "Documentation"],
    relatedApiEndpoints: ["GET /api/ops/login-hint"],
    content: `## What

**Operations Console** (\`/ops\`) is for staff only. Middleware requires a JWT with \`role\` of \`admin\` or \`superadmin\`. Unauthenticated or non-staff users are sent to \`/ops/login\`.

Internal **documentation** uses a stricter gate: ops role **and** an authorized staff email (domain or allowlist).

## Why

Ops tools can ban users, approve listings, and send marketing mail. Documentation may describe env names and internal runbooks — restrict to Isisel staff emails.

## Who

Ops staff signing in with credentials. Documentation consumers must also pass \`canAccessOpsDocumentation\`.

## How

1. Visit \`/ops/login\` → NextAuth \`ops-credentials\` provider.
2. Middleware \`pathname.startsWith("/ops")\` checks \`isOpsStaff(token.role)\`.
3. Documentation page/API helpers call \`canAccessOpsDocumentation(user)\`.

Documentation email rules (\`utils/documentation/access.js\`):

- Domain from \`OPS_EMAIL_DOMAIN\` or \`ISEL_OPS_EMAIL_DOMAIN\` (default \`isisel.com\`).
- Optional full-email allowlist: \`OPS_DOCUMENTATION_EMAILS\` (comma-separated).
- Never expose these values to the client bundle.

## Business rules

- Staff role alone is not enough for docs — email must match domain/allowlist.
- Legacy \`/admin\` requires same staff role; \`/admin\` root redirects to \`/ops\`.

## Technical implementation

- \`isOpsStaff\` / \`OPS_ROLES\` in \`utils/opsAuth.js\`.
- Page gate: \`requireOpsDocumentationPage\`.
- API gate: \`requireOpsDocumentationApi\`.

## Troubleshooting

- Staff can open \`/ops\` but not docs → email domain mismatch or allowlist miss.
- Redirect loop on \`/ops/login\` → already staff; middleware sends to \`/ops\`.
`,
  }),

  article({
    slug: "properties-listings",
    title: "Properties and listings",
    category: "Properties & Listings",
    subcategory: "Listings",
    summary:
      "Property model, rates, moderation statuses, public visibility, catalog beta, and host add/edit flows.",
    tags: ["listings", "moderation", "rates", "catalog-beta"],
    featureStatus: "active",
    relatedFeatures: [
      "Listing moderation",
      "Public catalog",
      "Host listings",
    ],
    relatedRoutes: [
      "/properties",
      "/properties/[id]",
      "/properties/add",
      "/host/listings",
      "/ops/listings",
    ],
    relatedFiles: [
      "property_app/models/Property.js",
      "property_app/utils/listingApproval.js",
      "property_app/utils/listings/catalogBeta.js",
      "property_app/utils/listings/propertySlug.js",
      "property_app/utils/propertyRates.js",
    ],
    relatedModels: ["Property"],
    relatedApiEndpoints: [
      "GET/POST /api/properties",
      "GET/PUT/DELETE /api/properties/[id]",
      "PUT /api/properties/[id]/rates",
    ],
    content: `## What

A **listing** is a \`Property\` document: identity, location, beds/baths, amenities, rates, media, check-in/out times, booking policy overrides, and moderation fields.

Public URLs prefer a stable \`slug\` under \`/properties/[slug]\`.

## Why

Hosts need flexible rates (nightly/weekly/monthly + weekend premium + custom day rates). Ops need a moderation queue before public launch quality is safe.

## Who

Verified hosts create/edit; ops approve/reject/hide; guests browse when catalog beta allows.

## How

1. Host adds listing at \`/properties/add\` (auth + verified).
2. New submissions set \`status: pending\` + \`listingModerationRequestedAt\`.
3. Ops reviews at \`/ops/listings\` (also legacy admin listings APIs).
4. Approved + \`listed !== false\` → public catalog / sitemap.

**Catalog beta** (\`utils/listings/catalogBeta.js\`): default closed; only ops + verified hosts browse others’ listings until \`NEXT_PUBLIC_LISTINGS_CATALOG_BETA=false\`.

## Business rules

- Legacy properties without a moderation request stay publicly visible (see \`approvedListingQuery\`).
- \`listed: false\` hides approved inventory from guests without deleting.
- Rejected listings are not public; owners and ops can still view.
- At least one rate required to book (\`validateRatesPayload\`).

## Technical implementation

- Visibility helpers: \`utils/listingApproval.js\` (\`publicListingQuery\`, \`canUserViewListing\`).
- Fee math for stays: \`calculateStayTotal\` / \`calculateBookingFees\` in \`utils/propertyRates.js\`.
- Serialization for client: \`utils/serializePropertyForClient.js\`.

## Troubleshooting

- Listing stuck pending → missing ops approval or \`listingModerationRequestedAt\` not set on old drafts.
- Guest 404 on known listing → catalog beta or \`listed: false\` or rejected status.
`,
  }),

  article({
    slug: "search-discovery",
    title: "Search and discovery",
    category: "Search & Discovery",
    subcategory: "Catalog",
    summary:
      "How guests and hosts discover inventory today: home explore, property pages, bookmarks, featured flags — and what is not built yet.",
    tags: ["explore", "catalog", "bookmarks", "beta"],
    featureStatus: "partial",
    relatedFeatures: ["Home explore", "Saved properties", "Featured listings"],
    relatedRoutes: ["/", "/properties", "/saved-properties"],
    relatedFiles: [
      "property_app/app/page.jsx",
      "property_app/utils/listings/catalogBeta.js",
      "property_app/utils/listingApproval.js",
      "property_app/components/home/HomePortalHero.jsx",
    ],
    relatedModels: ["Property", "User"],
    relatedApiEndpoints: [
      "GET /api/properties",
      "GET/POST /api/user/bookmarks",
    ],
    content: `## What

Discovery is primarily **browse-based**: home portal, property grid/list APIs, featured flag (\`is_featured\`), and **saved properties** (bookmarks on \`User\`).

There is **no dedicated full-text search engine** (no Elasticsearch/Atlas Search product surface) in the current app code.

## Why

MVP focuses on curated inventory and host beta access rather than open marketplace SEO traffic.

## Who

- Ops/hosts: can browse in catalog beta.
- Anonymous guests: blocked from catalog browse while beta defaults to on.
- Any signed-in user: bookmarks API when they can see a listing.

## How

1. \`GET /api/properties\` applies public/approved filters (and session visibility).
2. Home hero / explore components render the catalog UX.
3. Bookmarks: \`User.bookmarks\` via \`/api/user/bookmarks\`.
4. \`listingPrice\` is indexed for future/price filter use.

## Business rules

- Catalog beta is **on by default** until explicitly disabled.
- Only publicly visible listings appear for guests when catalog is open.
- Featured is a boolean on Property — ops/host tooling may set it; treat as editorial, not a paid ads system (**not** a separate ads product).

## Technical implementation

Key gates: \`canBrowseListingCatalog\`, \`publicListingQuery\`, \`withApprovedListingFilter\`.

## Troubleshooting

- Empty home for guest → expected under catalog beta.
- Bookmark fails → not signed in, or listing not visible to session.
`,
  }),

  article({
    slug: "booking-lifecycle",
    title: "Booking lifecycle",
    category: "Bookings & Reservations",
    subcategory: "Lifecycle",
    summary:
      "Pending → confirmed → cancelled flow; manual WhatsApp requests vs gateway finalize; pricing snapshots and host/ops mutation tools.",
    tags: ["bookings", "pending", "manual", "gateway"],
    featureStatus: "active",
    relatedFeatures: [
      "Manual booking request",
      "Gateway confirm",
      "Modify/cancel",
    ],
    relatedRoutes: [
      "/my-bookings",
      "/host/reservations",
      "/ops/reservations",
      "/bookings/payment-success",
    ],
    relatedFiles: [
      "property_app/models/Booking.js",
      "property_app/utils/bookings/createManualBooking.js",
      "property_app/utils/bookings/confirmBooking.js",
      "property_app/utils/bookings/mutateBooking.js",
      "property_app/utils/bookings/finalizePaidTransaction.js",
      "property_app/utils/bookings/bookingPolicy.js",
    ],
    relatedModels: ["Booking", "Transaction", "Property"],
    relatedApiEndpoints: [
      "POST /api/bookings/request",
      "GET/PATCH /api/properties/[id]/bookings/[bookingId]",
      "PATCH /api/user/bookings/[bookingId]",
      "POST /api/bookings/[id]/resend-confirmation",
    ],
    content: `## What

A **Booking** holds stay dates, guest contact (including phone), status, payment mode, pricing snapshot, and optional creator attribution.

Statuses: \`pending\` | \`confirmed\` | \`cancelled\`.

## Why

Most guests **request** a stay without paying in-app. Dates are held while the host collects payment (WhatsApp/call). Online gateway path exists for ops (and future open checkout).

## Who

Guests request; hosts manage reservations/calendar; ops can train, mutate, and run gateway tests.

## How

### Manual (default for guests)

1. Signed-in guest posts \`POST /api/bookings/request\` with dates + **valid phone**.
2. \`createManualBookingRequest\` validates availability, rates, promo; creates \`paymentMode: manual\`, usually \`pending\`.
3. Host contacts guest; confirms offline; host/ops tools move status toward confirmed as appropriate.
4. Emails/push may fire per notification prefs.

### Gateway (ops-only online today)

1. Ops (when gateway flag on) uses Reserve + GeniusPay/Creem initialize.
2. Webhook / finalize path confirms booking, writes \`Transaction\`, sends confirmation emails.

### Mutations

\`mutateBooking.js\` / property booking routes support modify dates, cancel, unlist (hide from calendar without cancelling), and property-to-property moves (host calendar).

## Business rules

- Guests cannot book their own listing.
- Phone required on manual requests so hosts can WhatsApp.
- Pending stays **block availability** like confirmed (held inventory).
- \`listed: false\` on a booking hides it from calendars without cancelling.
- \`source: ops_training\` excluded from investor analytics.
- Policy defaults in \`bookingPolicy.js\` (free cancel / modify windows).

## Technical implementation

Pricing snapshot stores accommodation, cleaning fee, platform commission, promo fields. Creator commissions upsert via \`commissionEngine\` when attributed.

## Troubleshooting

- Request 403 “online payment required” → session is ops with gateway enabled; use Reserve checkout instead of manual request.
- Double hold → check overlapping pending bookings on availability payload.
`,
  }),

  article({
    slug: "availability-system",
    title: "Availability system",
    category: "Bookings & Reservations",
    subcategory: "Calendar",
    summary:
      "PropertyAvailability documents, host blocks, default open/closed, custom day rates, and merge with bookings for calendar grids.",
    tags: ["availability", "blocks", "calendar", "custom-rates"],
    featureStatus: "active",
    relatedFeatures: ["Host calendar", "Stay validation", "Custom day rates"],
    relatedRoutes: ["/host/calendar", "/properties/[id]"],
    relatedFiles: [
      "property_app/models/PropertyAvailability.js",
      "property_app/utils/availability/availabilityService.js",
      "property_app/utils/availability/validateStay.js",
      "property_app/utils/availability/calendarGrid.js",
      "property_app/utils/availability/hostBlocks.js",
    ],
    relatedModels: ["PropertyAvailability", "Booking"],
    relatedApiEndpoints: [
      "GET/PUT /api/properties/[id]/availability",
      "GET /api/creators/properties/[id]/availability",
    ],
    content: `## What

Each listing has at most one \`PropertyAvailability\` doc (collection \`PropertyAvailabilities\`):

- \`defaultAvailability\`: \`open\` | \`closed\`
- \`hostBlocks\`: date ranges the host blocks
- \`customDayRates\`: per-day USD overrides
- \`hostId\`: copied from property owner

Calendar views **merge** host blocks with bookings (pending + confirmed that are listed).

## Why

Hosts need to close nights, set special prices, and see guest holds without a separate PMS.

## Who

Hosts edit via console/API; guests only read effective availability on the listing; creators portal can read availability for assigned properties.

## How

1. \`ensurePropertyAvailability(propertyId)\` lazy-creates a doc.
2. \`upsertPropertyAvailability\` atomically updates blocks/defaults/rates.
3. \`getAvailabilityPayload\` returns merged calendar for UI and stay checks.
4. \`validateStayDates\` rejects overlaps / closed nights before booking create.

Day state labels include \`booked\` vs \`blocked\` (see \`calendarGrid.js\`).

## Business rules

- Default is **open** unless host sets closed.
- Host blocks and bookings both remove nights from sellable inventory.
- Custom day rates feed \`calculateStayTotal\` when present.
- Training reservations still occupy calendar for host drills.

## Technical implementation

API: \`app/api/properties/[id]/availability/route.js\`. Backfill script: \`npm run db:backfill-availability-host\`.

## Troubleshooting

- Nights bookable but host thought blocked → block endDate semantics / timezone date-only strings (\`YYYY-MM-DD\`).
- Missing availability doc → first read should auto-create; if not, check Mongo connectivity.
`,
  }),

  article({
    slug: "host-console",
    title: "Host console",
    category: "Host Console",
    subcategory: "Workspace",
    summary:
      "Verified-host workspace: home rings, reservations, stay calendar, listings, creators program, and inbox.",
    tags: ["host", "console", "calendar", "pwa"],
    featureStatus: "active",
    relatedFeatures: [
      "Host home",
      "Reservations calendar",
      "Host creators",
      "Push alerts",
    ],
    relatedRoutes: [
      "/host",
      "/host/reservations",
      "/host/calendar",
      "/host/listings",
      "/host/creators",
      "/host/messages",
      "/host/install",
      "/host/onboarding",
      "/host/pending",
    ],
    relatedFiles: [
      "property_app/components/host/HostNav.jsx",
      "property_app/components/host/home/HostHomeView.jsx",
      "property_app/utils/host/navCounts.js",
      "property_app/utils/host/reservationsCalendar.js",
      "property_app/app/api/host/reservations/route.js",
    ],
    relatedModels: ["Booking", "Property", "Message", "CreatorPartner"],
    relatedApiEndpoints: [
      "GET /api/host/reservations",
      "GET/POST /api/host/creators",
      "POST /api/host/onboarding",
      "POST /api/push/subscribe",
    ],
    content: `## What

The **Host Console** (\`/host\`) is the day-to-day workspace for verified hosts. Navigation (\`HostNav\`): Home, Reservations, Calendar, Listings, Creators, Messages.

## Why

Hosts need arrivals/departures at a glance, calendar editing, and guest contact without using ops tools.

## Who

Users with \`hostStatus: verified\`. Applicants use onboarding/pending/install flows first.

## How

- **Home rings** (Host Home): Arrivals (check-in today, pending+confirmed), Departures (check-out today, **confirmed only**), In stay, Needs you.
- **Reservations**: list/manage stays; pending badge via \`getHostNavCounts\`.
- **Calendar**: multi-listing stay calendar — drag between listings (future stays), resize dates (rules in host calendar components).
- **Listings**: manage inventory; add via \`/properties/add\`.
- **Creators**: partner codes + commission ledger UI.
- **Messages**: host inbox (shared Message model).
- **Install**: PWA install guide (public) for lock-screen push readiness.

## Business rules

- Middleware blocks unverified hosts from console routes (except onboarding/pending/install).
- Calendar vertical move requires 2+ listings and check-in not before today.
- Push badge (\`hostPushBadge\`) increments on new reservation alerts.

## Technical implementation

Layout under \`app/host/\`. Push: \`utils/push/webPush.js\` + \`/api/push/*\`. Creators program builder: \`utils/host/creatorsProgram.js\`.

## Troubleshooting

- Stale home rings after calendar drag → path revalidation for \`/host\` must run after booking PATCH.
- No push → missing VAPID/subscribe; user must install PWA / allow notifications.
`,
  }),

  article({
    slug: "ops-console",
    title: "Operations console",
    category: "Operations Console",
    subcategory: "Workspace",
    summary:
      "Staff console for users, hosts, listings, reservations, payments, analytics, messages, founding hosts, and marketing CRM.",
    tags: ["ops", "moderation", "analytics", "marketing"],
    featureStatus: "active",
    relatedFeatures: [
      "Listing moderation",
      "User bans",
      "Training reservations",
      "Marketing sends",
    ],
    relatedRoutes: [
      "/ops",
      "/ops/analytics",
      "/ops/users",
      "/ops/messages",
      "/ops/hosts",
      "/ops/founding-hosts",
      "/ops/listings",
      "/ops/reservations",
      "/ops/transactions",
      "/ops/marketing",
    ],
    relatedFiles: [
      "property_app/components/ops/OpsNav.jsx",
      "property_app/components/ops/OpsShell.jsx",
      "property_app/utils/opsAnalytics/buildReport.js",
      "property_app/utils/opsTraining/constants.js",
    ],
    relatedModels: [
      "User",
      "Property",
      "Booking",
      "Transaction",
      "HostProspect",
      "CreatorLead",
      "InvestorLead",
      "MarketingSend",
    ],
    relatedApiEndpoints: [
      "GET /api/ops/overview",
      "GET /api/ops/users",
      "GET /api/ops/reservations",
      "GET /api/ops/analytics",
      "POST /api/ops/messages",
      "POST /api/ops/messages/broadcast",
      "POST /api/ops/marketing/send",
      "POST /api/ops/listings/[id]/training-reservation",
    ],
    content: `## What

The **Operations Console** is the internal control plane. \`OpsNav\` links: Home, Analytics, Users, Messages, Hosts, Founding, Listings, Reservations, Payments, Marketing.

## Why

Ops needs one place to moderate inventory, support hosts/guests, run founding-host program, seed training stays, and work creator/investor pipelines.

## Who

\`admin\` and \`superadmin\` only (middleware + API checks).

## How

- **Home / overview**: \`/api/ops/overview\` snapshots.
- **Users**: inspect, ban, message accounts.
- **Listings**: moderation queue + hide/list + training reservation modal.
- **Reservations / Payments**: cross-host booking and transaction views.
- **Messages**: 1:1 ops messages + broadcast panel.
- **Marketing**: templates/sends, acquisition prospects, creators leads, investors leads (subnav).
- **Founding hosts**: program settings + allocations.
- **Analytics**: reports/export (PDF/CSV helpers under \`utils/opsAnalytics\`).

## Business rules

- Training bookings use \`source: ops_training\` and training guest users — visible to hosts, excluded from investor analytics.
- Superadmin-only actions may apply for some destructive/hide flows (check route handlers when unsure).
- Marketing From/Reply-To must stay on verified \`isisel.com\` (Resend).

## Technical implementation

UI under \`components/ops/\`. APIs under \`app/api/ops/\`. Legacy \`app/api/admin/*\` still powers some host/listing/transaction tools mirrored in ops UI.

## Troubleshooting

- Blank analytics → date range helpers or Mongo traffic collections empty.
- Cannot send marketing → Resend marketing keys / from-address domain.
`,
  }),

  article({
    slug: "database-architecture",
    title: "Database architecture",
    category: "Database",
    subcategory: "MongoDB",
    summary:
      "MongoDB Atlas via Mongoose; database name KamaProperties; core collections for users, listings, bookings, traffic, creators, and docs.",
    tags: ["mongodb", "mongoose", "atlas", "schemas"],
    featureStatus: "active",
    relatedFeatures: ["Mongoose models", "Health ping cron"],
    relatedRoutes: [],
    relatedFiles: [
      "property_app/config/database.js",
      "property_app/models/",
      "property_app/vercel.json",
    ],
    relatedModels: [
      "User",
      "Property",
      "PropertyAvailability",
      "Booking",
      "Transaction",
      "Message",
      "Documentation",
    ],
    relatedApiEndpoints: ["GET /api/health/db"],
    content: `## What

Isisel persists state in **MongoDB** through **Mongoose**. Connection helper: \`config/database.js\` — always uses \`dbName: "KamaProperties"\`.

## Why

Document model fits listings, nested rates/location, and evolving ops CRM collections without a second database.

## Who

All server routes and server actions. Client never talks to Mongo directly.

## How

\`connectToDatabase()\` caches the connection for serverless. If URI missing, returns \`false\` (safe for Docker builds). Wrong DB name triggers reconnect.

### Core collections (models)

| Model | Purpose |
|---|---|
| User | Accounts, roles, bookmarks, payout, push |
| Property | Listings |
| PropertyAvailability | Blocks & custom rates |
| Booking | Stays |
| Transaction | Payment records |
| Message | In-app messaging |
| HostApplication / HostProspect* | Host pipeline |
| Creator* | Leads, partners, codes, commissions |
| Traffic* | Ops traffic analytics |
| Documentation | Ops knowledge base |
| PlatformSettings / AuditLog | Settings & audit |

## Business rules

- Atlas **M0 pauses after ~30 days idle** — production cron pings \`/api/health/db\` daily (09:00 UTC) via \`vercel.json\`.
- Availability collection name is explicitly \`PropertyAvailabilities\`.

## Technical implementation

Schemas in \`property_app/models/\`. Scripts under \`property_app/scripts/\` for backfills.

## Troubleshooting

- \`db: down\` on health → URI wrong, network allowlist, or paused cluster — resume in Atlas.
- Silent empty data after idle months → classic M0 pause; wake cluster then redeploy/cron.
`,
  }),

  article({
    slug: "api-architecture",
    title: "API architecture",
    category: "API & Backend",
    subcategory: "Route Handlers",
    summary:
      "Next.js App Router route handlers organized by domain: auth, properties, bookings, payments webhooks, host, ops, creators, push.",
    tags: ["api", "route-handlers", "webhooks"],
    featureStatus: "active",
    relatedFeatures: ["JSON APIs", "Payment webhooks", "Health checks"],
    relatedRoutes: [],
    relatedFiles: [
      "property_app/app/api/",
      "property_app/utils/request.js",
      "property_app/middleware.js",
    ],
    relatedModels: [],
    relatedApiEndpoints: [
      "GET /api/health",
      "GET /api/health/db",
      "POST /api/bookings/request",
      "POST /api/payments/geniuspay/webhook",
      "POST /api/payments/creem/webhook",
    ],
    content: `## What

Backend surface is **Next.js Route Handlers** under \`property_app/app/api/**/route.js\`. No Express server.

## Why

Keeps deploy simple on Vercel/Docker while colocating domain logic in \`utils/\`.

## Who

Browser clients, NextAuth, payment provider webhooks, Vercel cron, and server actions.

## How

Major trees:

- \`/api/auth/*\` — NextAuth
- \`/api/properties/*\` — CRUD, availability, bookings nested
- \`/api/bookings/*\` — guest request + resend confirmation
- \`/api/payments/{geniuspay,creem}/{initialize,webhook}\`
- \`/api/host/*\` — onboarding, reservations, creators
- \`/api/ops/*\` — staff tools
- \`/api/creators/*\` — portal, promo validate, leads, console
- \`/api/user/*\` — profile, settings, bookmarks, language, payout
- \`/api/push/*\` — VAPID + subscribe + badge
- \`/api/admin/*\` — legacy staff endpoints
- \`/api/health\` (+ \`/db\`) — liveness / Mongo ping

Auth pattern: \`getServerSession(authOptions)\` + role helpers inside handlers. Middleware only gates pages, not every API (APIs re-check).

## Business rules

- Webhooks must verify signatures (GeniusPay/Creem helpers) before mutating bookings.
- Ops APIs must enforce \`isOpsStaff\`.
- Payment initialize enforces \`canUseOnlineCheckout\` (ops-only).

## Technical implementation

Shared request helpers in \`utils/request.js\` where used. Prefer domain functions in \`utils/bookings\`, \`utils/payments\`, etc., rather than fat routes.

## Troubleshooting

- Webhook 401/400 → secret mismatch or raw body verification failure.
- API 401 while page works → session cookie not sent (SameSite / URL mismatch).
`,
  }),

  article({
    slug: "cloudinary-media",
    title: "Cloudinary media",
    category: "Media & Cloudinary",
    subcategory: "Uploads",
    summary:
      "Listing images and avatars stored on Cloudinary; server config via CLOUDINARY_URL or discrete keys; folder helpers and backfill scripts.",
    tags: ["cloudinary", "images", "uploads"],
    featureStatus: "active",
    relatedFeatures: ["Listing photos", "Avatar upload"],
    relatedRoutes: ["/properties/add", "/settings", "/profile"],
    relatedFiles: [
      "property_app/utils/cloudinary/cloudinary.js",
      "property_app/utils/cloudinary/uploadPropertyMedia.js",
      "property_app/utils/cloudinary/uploadUserAvatar.js",
      "property_app/utils/cloudinary/deletePropertyMedia.js",
      "property_app/utils/uploadPropertyImages.js",
      "property_app/utils/compressListingImage.js",
    ],
    relatedModels: ["Property", "User"],
    relatedApiEndpoints: [
      "POST /api/properties",
      "PUT /api/properties/[id]",
      "POST /api/user/profile/avatar",
    ],
    content: `## What

Listing media and user avatars are stored in **Cloudinary**. The app configures the SDK from \`CLOUDINARY_URL\` **or** \`CLOUDINARY_CLOUD_NAME\` + \`CLOUDINARY_API_KEY\` + \`CLOUDINARY_API_SECRET\`.

Public cloud name may also appear as \`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME\` for client display helpers.

## Why

Hosts upload multiple listing photos; Cloudinary handles storage, transforms, and CDN delivery without local disk on serverless.

## Who

Hosts (listing images), users (avatars), ops/scripts (folder provision/backfill).

## How

1. \`isCloudinaryConfigured()\` gates uploads.
2. \`uploadPropertyMedia\` / \`uploadPropertyImages\` push assets; folder path helpers under \`utils/cloudinary/generateFolderPath.js\`.
3. Property \`images\` array stores Cloudinary descriptors/URLs (\`Schema.Types.Mixed\`).
4. Optional audio field exists on Property (media-capable; treat as advanced/optional).
5. Delete helpers remove assets when listings change.

Scripts: \`db:backfill-cloudinary-folders\`, \`db:provision-cloudinary-folders\`, \`db:audit-property-images\`.

## Business rules

- Never commit API secrets; use env only.
- \`CLOUDINARY_LEGACY_HOST_ID\` is optional for ops/scripts migration only.

## Technical implementation

Core config: \`utils/cloudinary/cloudinary.js\`. Client URL helpers: \`utils/propertyImageUrl.js\`, email absolute image helpers under \`utils/email/\`.

## Troubleshooting

- Upload fails silently → missing Cloudinary env in the **server** runtime.
- Broken images after migration → run audit/backfill scripts; check folder paths.
`,
  }),

  article({
    slug: "maps-location",
    title: "Maps and location",
    category: "Maps & Location",
    subcategory: "Google Maps",
    summary:
      "Google Maps JavaScript + Places (New) for listing address autocomplete and map pins; soft-pin fallback without keys.",
    tags: ["maps", "places", "geolocation"],
    featureStatus: "partial",
    relatedFeatures: ["Address autocomplete", "Listing map pin", "Ops live map"],
    relatedRoutes: ["/properties/add", "/properties/[id]", "/ops"],
    relatedFiles: [
      "property_app/utils/googleMaps.js",
      "property_app/components/maps/PropertyLocationMap.jsx",
      "property_app/next.config.mjs",
    ],
    relatedModels: ["Property"],
    relatedApiEndpoints: [],
    content: `## What

Listing location uses **Google Maps Platform**:

- Maps JavaScript API — map + markers
- Places API **(New)** — autocomplete / place details

Property stores street, city, country, \`placeId\`, \`lat\`/\`lng\`, \`formatted\`, and \`showExactLocation\`.

## Why

Hosts need accurate pins for guest trust; ops may visualize activity (e.g. \`OpsLiveMap\`).

## Who

Hosts during add/edit listing; guests viewing approximate/exact location per listing flag.

## How

Env names (no values in docs): \`GOOGLE_MAPS_API_KEY\`, \`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY\`, optional \`NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID\`, optional Places alias.

\`next.config.mjs\` can map server \`GOOGLE_MAPS_API_KEY\` → public browser name at **build** time. Docker: pass Maps keys as **build-args** (\`npm run docker:release\`) — runtime \`--env-file\` alone does **not** inline \`NEXT_PUBLIC_*\`.

Without a key, hosts can still enter address manually with a soft pin.

## Business rules

- Prefer Places API (New); legacy Autocomplete triggers \`LegacyApiNotActivatedMapError\` if misconfigured.
- Restrict keys by HTTP referrer in Google Cloud.
- Exact pin visibility controlled by \`showExactLocation\`.

## Technical implementation

Loader + timeout: \`utils/googleMaps.js\` (\`GOOGLE_MAPS_LOAD_TIMEOUT_MS = 10000\`). UI: \`components/maps/PropertyLocationMap.jsx\`.

## Troubleshooting

- Map blank in Docker image → key not present at image **build**.
- Autocomplete broken → enable Places API (New), not only legacy Places.
`,
  }),

  article({
    slug: "email-system",
    title: "Email system (Resend)",
    category: "Emails & Notifications",
    subcategory: "Transactional",
    summary:
      "Resend-powered booking, moderation, founding-host, ops message, and marketing emails with preference opt-outs.",
    tags: ["resend", "email", "notifications"],
    featureStatus: "active",
    relatedFeatures: [
      "Booking emails",
      "Ops message email",
      "Marketing sends",
    ],
    relatedRoutes: ["/settings", "/ops/messages", "/ops/marketing"],
    relatedFiles: [
      "property_app/utils/email/sendBookingEmails.js",
      "property_app/utils/email/sendOpsMessageEmail.js",
      "property_app/utils/email/sendListingModerationEmails.js",
      "property_app/utils/email/fromAddress.js",
      "property_app/utils/email/resendKeys.js",
      "property_app/utils/ops/sendTemplateEmail.js",
    ],
    relatedModels: ["Booking", "Message", "MarketingSend", "User"],
    relatedApiEndpoints: [
      "POST /api/bookings/[id]/resend-confirmation",
      "POST /api/ops/messages",
      "POST /api/ops/marketing/send",
    ],
    content: `## What

Outbound email uses **Resend**. Domains/mailboxes are expected on verified **isisel.com**.

Streams:

- Booking confirm / modify / cancel (guest + host)
- Listing moderation notices
- Founding host mail
- Ops → user message notifications
- Marketing / templates (separate from/reply-to)

## Why

Reservations and moderation must leave an audit trail outside the app UI.

## Who

Guests/hosts receive transactional mail subject to \`User.preferences.notifications\`. Ops trigger support and marketing sends.

## How

- Keys: \`RESEND_API_KEY\`, \`RESEND_BOOKING_API_KEY\`, \`RESEND_ADMIN_API_KEY\` (see \`resendKeys.js\`).
- From/reply: \`EMAIL_FROM\`, \`EMAIL_REPLY_TO\`, \`MARKETING_EMAIL_FROM\`, \`MARKETING_EMAIL_REPLY_TO\`, \`ADMIN_EMAIL\`.
- Optional Resend template IDs: \`RESEND_TEMPLATE_GUEST_ID\`, \`RESEND_TEMPLATE_HOST_ID\`, \`RESEND_TEMPLATES_READY\`.
- Booking HTML builders in \`bookingEmailTemplateHtml.js\`; dispatch status stored on \`Booking\` email status fields.
- Setup script: \`npm run setup:email-templates\`.

Web Push is separate (\`utils/push\`) for host lock-screen alerts.

## Business rules

- Honor notification preferences unless a forced resend path bypasses them.
- Marketing From/Reply-To must be \`@isisel.com\`.
- Idempotent confirmation sends across payment webhook retries.

## Technical implementation

Primary module: \`utils/email/sendBookingEmails.js\` (\`isBookingEmailConfigured\`). Ops message: \`sendOpsMessageEmail.js\`.

## Troubleshooting

- Local 403 from Resend → domain not verified or wrong API key in \`.env.local\` (Vercel env does not apply to \`npm run dev\`).
- Prefs ignored → check force-resend flags vs \`applyNotificationPrefsToEmailPayload\`.
`,
  }),

  article({
    slug: "payments-integrations",
    title: "Payments integrations",
    category: "Payments",
    subcategory: "Providers",
    summary:
      "Guest checkout is WhatsApp + manual. GeniusPay is the active online rail for ops-only testing; Creem is demoted/inactive live; Flutterwave is deprecated.",
    tags: ["geniuspay", "creem", "flutterwave", "manual", "momo"],
    featureStatus: "partial",
    relatedFeatures: [
      "Manual arrange-with-host",
      "GeniusPay checkout",
      "Creem checkout",
    ],
    relatedRoutes: ["/bookings/payment-success", "/ops/transactions"],
    relatedFiles: [
      "property_app/utils/bookings/paymentMode.js",
      "property_app/utils/payments/paymentAccess.js",
      "property_app/utils/payments/geniusPayClient.js",
      "property_app/utils/payments/creemClient.js",
      "property_app/utils/bookings/finalizePaidTransaction.js",
      "property_app/app/api/payments/geniuspay/initialize/route.js",
      "property_app/app/api/payments/creem/initialize/route.js",
    ],
    relatedModels: ["Booking", "Transaction", "User"],
    relatedApiEndpoints: [
      "POST /api/payments/geniuspay/initialize",
      "POST /api/payments/geniuspay/webhook",
      "POST /api/payments/creem/initialize",
      "POST /api/payments/creem/webhook",
      "GET /api/transactions",
    ],
    content: `## What

Payment collection has two layers:

1. **Manual (live guest path)** — guest provides WhatsApp/phone, request stays \`pending\`, host arranges Mobile Money / cash / transfer offline.
2. **Online gateway (ops-only today)** — GeniusPay (and legacy Creem routes) when \`NEXT_PUBLIC_USE_PAYMENT_GATEWAY=true\` and secrets exist.

\`canUseOnlineCheckout\` in \`utils/payments/paymentAccess.js\` returns true **only for ops staff**. Guests/hosts do not get in-app MoMo/card checkout.

## Why

Soft launch prioritizes host-arranged payment trust. Online rails stay available for ops QA and future open checkout without exposing them to all guests yet.

## Who

- Guests/hosts: manual + WhatsApp.
- Ops: may run GeniusPay (preferred) when configured.
- Creem: code paths remain but are **demoted / inactive for live guest card** relative to GeniusPay preference.
- Flutterwave: **deprecated** (dependency may remain; UI path not offered).

## How

Flags (names only):

- \`NEXT_PUBLIC_USE_PAYMENT_GATEWAY\`
- \`NEXT_PUBLIC_PAYMENT_PROVIDER\` (\`geniuspay\` | \`creem\` | deprecated \`flutterwave\`)
- \`NEXT_PUBLIC_GENIUSPAY_CHECKOUT\` / \`NEXT_PUBLIC_CREEM_CHECKOUT\`
- Server secrets: \`GENIUSPAY_*\`, \`CREEM_*\` (never in client)

Initialize routes create provider sessions; webhooks call finalize helpers to confirm bookings and write \`Transaction\` (includes cleaning fee metadata).

Host payout IBAN on \`User.hostPayout\` is stored for **future** platform payouts — not an automated payout engine yet.

## Business rules

- Default without gateway flag: offline arrange-with-host.
- Ops with gateway on cannot use manual request API for listings — must use online Reserve.
- Flutterwave checkout helpers exist but are marked deprecated in \`paymentMode.js\`.
- Partner email allowlists in \`.env.example\` comments are historical; **code currently ops-gates** checkout.

## Technical implementation

Currency FX helpers: \`geniusPayCurrency.js\`. Webhook verification: \`geniusPayWebhook.js\`, \`creemWebhook.js\`.

## Troubleshooting

- Guest sees no MoMo/card → expected; use phone + host arrangement.
- Ops initialize 403 → not staff session, or gateway flag/secrets missing.
- Creem “product not found” → test vs live product ID mismatch (see \`.env.example\` comments).
`,
  }),

  article({
    slug: "deployment",
    title: "Deployment and infrastructure",
    category: "Deployment & Infrastructure",
    subcategory: "Hosting",
    summary:
      "Production on Vercel (www.isisel.com), optional Docker images via docker:release, health endpoints, and Atlas keep-warm cron.",
    tags: ["vercel", "docker", "cron", "deploy"],
    featureStatus: "active",
    relatedFeatures: ["Vercel prod", "Docker image", "DB health cron"],
    relatedRoutes: [],
    relatedFiles: [
      "property_app/vercel.json",
      "property_app/Dockerfile",
      "property_app/docker-compose.yml",
      "property_app/DOCKER_READINESS.md",
      "property_app/scripts/docker-release.mjs",
      "property_app/docs/HANDOFF.md",
    ],
    relatedModels: [],
    relatedApiEndpoints: ["GET /api/health", "GET /api/health/db"],
    content: `## What

Production marketplace is served at **https://www.isisel.com** (Vercel). The app also ships a **standalone Docker** image build (\`Dockerfile\` + \`npm run docker:release\`).

Version source of truth: \`VERSION\` / \`package.json\` (e.g. \`1.1.0\`).

## Why

Vercel fits Next.js serverless. Docker supports alternate hosts and local MVP tags (\`:mvp\`).

## Who

Engineers deploying; ops verifying health after release.

## How

### Vercel

- Set production env in the Vercel project (not committed).
- \`vercel.json\` cron: daily \`GET /api/health/db\` at 09:00 UTC.
- Handoff note: deploy from the **Git root** that Vercel expects — nested wrong root breaks builds. Prefer the team’s current CLI/project linkage documented in \`docs/HANDOFF.md\`.

### Docker

\`\`\`bash
cd property_app
npm run docker:plan
npm run docker:release
# runtime secrets via --env-file; NEXT_PUBLIC_* need build-args
\`\`\`

Health: \`GET /api/health\` (no Mongo) and \`GET /api/health/db\` (ping).

## Business rules

- Never bake secrets into image layers.
- Maps/public env must be present at **build** for client bundle.
- Keep Atlas active (cron) or the site looks “up” while all data routes 503.

## Technical implementation

Multi-stage Dockerfile: deps → builder → runner (Node 20). Compose file for local orchestration.

## Troubleshooting

- Deploy succeeded but Maps missing → rebuild with Maps build-args.
- Cron not firing → cron only exists after a production deploy that includes \`vercel.json\`.
`,
  }),

  article({
    slug: "environment-configuration",
    title: "Environment configuration",
    category: "Deployment & Infrastructure",
    subcategory: "Configuration",
    summary:
      "Catalog of environment variable NAMES used by property_app (no secret values). Public vs server-only split.",
    tags: ["env", "configuration", "secrets"],
    featureStatus: "active",
    relatedFeatures: ["Config"],
    relatedRoutes: [],
    relatedFiles: ["property_app/.env.example", "property_app/next.config.mjs"],
    relatedModels: [],
    relatedApiEndpoints: [],
    content: `## What

Runtime and build behavior is controlled by environment variables. **This article lists names only — never paste secret values into the knowledge base.**

Canonical template: \`property_app/.env.example\`.

## Why

Ops and engineers need a checklist when provisioning Vercel, Docker, or local \`.env.local\`.

## Who

Deployers and staff with access to the secret store (Vercel env, password manager) — not the public site.

## How

### Public / inlined (\`NEXT_PUBLIC_*\` and mapped Maps keys)

- \`NEXT_PUBLIC_SITE_URL\`, \`NEXT_PUBLIC_DOMAIN\`, \`NEXT_PUBLIC_APP_URL\`
- \`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME\`
- \`NEXT_PUBLIC_CURRENCY_EXCHANGE_RATE_API\`
- \`NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY\` (deprecated provider)
- \`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY\`, \`NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID\`, \`NEXT_PUBLIC_GOOGLE_PLACES_API_KEY\`
- \`GOOGLE_MAPS_API_KEY\` (build-mapped)
- \`NEXT_PUBLIC_USE_PAYMENT_GATEWAY\`, \`NEXT_PUBLIC_PAYMENT_PROVIDER\`
- \`NEXT_PUBLIC_GENIUSPAY_CHECKOUT\`, \`NEXT_PUBLIC_CREEM_CHECKOUT\`
- \`NEXT_PUBLIC_PAYMENT_PARTNER_EMAILS\` (legacy soft-launch notes)
- \`NEXT_PUBLIC_LISTINGS_CATALOG_BETA\`

### Auth

- \`NEXTAUTH_URL\`, \`NEXTAUTH_SECRET\`
- \`GOOGLE_CLIENT_ID\`, \`GOOGLE_CLIENT_SECRET\`
- \`OPS_PASSWORD\`, \`OPS_EMAIL\`, \`OPS_PROMOTE\`, \`OPS_ROLE\` (scripts)
- \`OPS_FOUNDER_EMAIL\`

### Database

- \`MONGODB_URI\`

### Cloudinary

- \`CLOUDINARY_URL\` **or** \`CLOUDINARY_CLOUD_NAME\`, \`CLOUDINARY_API_KEY\`, \`CLOUDINARY_API_SECRET\`
- \`CLOUDINARY_LEGACY_HOST_ID\`

### Payments

- \`GENIUSPAY_API_KEY\` / \`GENIUSPAY_PUBLIC_KEY\`, \`GENIUSPAY_API_SECRET\` / \`GENIUSPAY_SECRET_KEY\`, \`GENIUSPAY_WEBHOOK_SECRET\`, \`GENIUSPAY_USD_TO_XOF\`, \`GENIUSPAY_USD_TO_EUR\`
- \`CREEM_PRODUCTION\`, \`CREEM_API_KEY\`, \`CREEM_PRODUCT_ID\`, \`CREEM_PRODUCT_ID_LIVE\`, \`CREEM_PRODUCT_ID_TEST\`, \`CREEM_WEBHOOK_SECRET\`, \`CREEM_SERVER\`
- \`FLUTTERWAVE_SECRET_KEY\`, \`FLUTTERWAVE_WEBHOOK_SECRET\` (deprecated)
- \`PAYMENT_PARTNER_EMAILS\`

### Email

- \`EMAIL_FROM\`, \`EMAIL_REPLY_TO\`, \`MARKETING_EMAIL_FROM\`, \`MARKETING_EMAIL_REPLY_TO\`, \`ADMIN_EMAIL\`
- \`RESEND_API_KEY\`, \`RESEND_BOOKING_API_KEY\`, \`RESEND_ADMIN_API_KEY\`
- \`RESEND_TEMPLATE_GUEST_ID\`, \`RESEND_TEMPLATE_HOST_ID\`, \`RESEND_TEMPLATES_READY\`

### Ops documentation ACL

- \`OPS_EMAIL_DOMAIN\`, \`ISEL_OPS_EMAIL_DOMAIN\`, \`OPS_DOCUMENTATION_EMAILS\`

### Runtime

- \`PORT\` (optional)

## Business rules

- Never commit \`.env.local\` or real secrets.
- Client bundles only see \`NEXT_PUBLIC_*\` (and build-mapped publics).

## Technical implementation

Read \`.env.example\` comments for provider-specific setup notes when rotating keys.

## Troubleshooting

- “Works on Vercel, not locally” → missing \`.env.local\` keys (especially Resend).
- “Works locally, not in Docker browser” → public vars not passed as build-args.
`,
  }),

  article({
    slug: "troubleshooting-index",
    title: "Troubleshooting index",
    category: "Troubleshooting",
    subcategory: "Index",
    summary:
      "Start here for common production and local failures: auth, Atlas pause, catalog beta, payments, email, and Maps.",
    tags: ["troubleshooting", "index", "runbook"],
    featureStatus: "active",
    relatedFeatures: [],
    relatedRoutes: ["/api/health", "/api/health/db", "/ops/login", "/login"],
    relatedFiles: [
      "property_app/docs/HANDOFF.md",
      "property_app/config/database.js",
      "property_app/.env.example",
    ],
    relatedModels: [],
    relatedApiEndpoints: ["GET /api/health", "GET /api/health/db"],
    content: `## What

Index of operational failure modes and which deeper articles to open.

## Why

Most “site broken” reports are a short list of infra or flag issues — not random UI bugs.

## Who

Ops + engineers on-call for www.isisel.com.

## How

| Symptom | Likely cause | See |
|---|---|---|
| HTML loads, all API/data 500 | Atlas M0 paused | \`troubleshooting-mongodb-paused\` |
| Guests see no listings | Catalog beta default on | \`troubleshooting-catalog-beta\` |
| Google sign-in fails | OAuth/NEXTAUTH_URL mismatch | \`authentication-nextauth\` |
| Ops password rejected | Role/hash/ban | \`ops-access\` |
| No booking emails | Resend key/domain | \`email-system\` |
| Guest cannot pay in-app | By design (manual) | \`payments-integrations\` |
| Map blank in Docker | Maps key not at build | \`maps-location\` |
| Host redirected to onboarding | \`hostStatus\` / JWT | \`user-roles\` |

Quick checks:

1. \`GET /api/health\` → process up
2. \`GET /api/health/db\` → Mongo up
3. Confirm env names present in the target environment (no values in chat logs)

## Business rules

- Prefer resume Atlas / fix env over code changes for infra outages.
- Do not “fix” guest online checkout unless product intentionally reopens \`canUseOnlineCheckout\`.

## Technical implementation

Cron keep-warm: \`vercel.json\` → \`/api/health/db\`.

## Troubleshooting

If none of the rows match, capture route, status code, and whether \`/api/health/db\` is ok before escalating.
`,
  }),

  article({
    slug: "troubleshooting-mongodb-paused",
    title: "Troubleshooting: MongoDB Atlas paused",
    category: "Troubleshooting",
    subcategory: "Database",
    summary:
      "Vercel serves the Next app but listings/auth fail when an idle Atlas Free cluster auto-pauses.",
    tags: ["mongodb", "atlas", "paused", "503"],
    featureStatus: "active",
    relatedFeatures: ["Health cron"],
    relatedRoutes: [],
    relatedFiles: [
      "property_app/config/database.js",
      "property_app/app/api/health/db/route.js",
      "property_app/vercel.json",
      "property_app/docs/HANDOFF.md",
    ],
    relatedModels: [],
    relatedApiEndpoints: ["GET /api/health/db"],
    content: `## What

Atlas **Free (M0)** clusters pause after roughly **30 days with zero connections**. The Next.js deployment can still respond while every Mongo-backed route fails.

## Why

Idle months (product pauses) still bill/host the frontend; the database sleeps.

## Who

Ops noticing empty home, login failures, or 503s on data APIs.

## How

1. Hit \`GET /api/health\` — expect ok.
2. Hit \`GET /api/health/db\` — if \`db: "down"\`, open Atlas and **resume** the cluster.
3. Confirm \`MONGODB_URI\` still points at the resumed cluster.
4. Ensure production cron for \`/api/health/db\` is deployed so the next quiet month does not pause again.

## Business rules

- Treat DB pause as infra, not an application regression.
- Keep the daily ping enabled on production.

## Technical implementation

\`connectToDatabase\` logs failures; health route runs \`{ ping: 1 }\`.

## Troubleshooting

- Health db ok but one collection empty → different issue (filters/beta), not pause.
- Cron never ran → redeploy with \`vercel.json\` crons.
`,
  }),

  article({
    slug: "troubleshooting-catalog-beta",
    title: "Troubleshooting: empty catalog / catalog beta",
    category: "Troubleshooting",
    subcategory: "Listings",
    summary:
      "Guests see no properties because NEXT_PUBLIC_LISTINGS_CATALOG_BETA defaults to closed; only verified hosts and ops browse.",
    tags: ["catalog", "beta", "listings"],
    featureStatus: "active",
    relatedFeatures: ["Catalog beta"],
    relatedRoutes: ["/", "/properties"],
    relatedFiles: [
      "property_app/utils/listings/catalogBeta.js",
      "property_app/utils/listingApproval.js",
    ],
    relatedModels: ["Property"],
    relatedApiEndpoints: ["GET /api/properties", "POST /api/bookings/request"],
    content: `## What

When catalog beta is enabled (the **default** if the env var is unset), \`canBrowseListingCatalog\` returns true only for **ops staff** and **verified hosts**. Anonymous guests and ordinary guests get an empty/closed catalog experience.

## Why

Soft launch: inventory is real, but public guest browse is intentionally gated.

## Who

Support agents hearing “the website has no homes.”

## How

1. Confirm whether \`NEXT_PUBLIC_LISTINGS_CATALOG_BETA\` is unset/true in the deployed environment.
2. Sign in as verified host or ops — listings should appear if moderation/listed flags allow.
3. To open public catalog: set \`NEXT_PUBLIC_LISTINGS_CATALOG_BETA=false\` and **rebuild/redeploy** (public env is build-time for client).
4. Also verify listings are approved and \`listed !== false\`.

## Business rules

- Closing the catalog does not delete properties.
- Booking request API also respects \`canBrowseListingCatalog\`.

## Technical implementation

\`utils/listings/catalogBeta.js\` + listing approval queries.

## Troubleshooting

- Host still sees nothing → their own listings rejected/pending, or API error (check health db).
`,
  }),

  article({
    slug: "troubleshooting-payments-ops-only",
    title: "Troubleshooting: online checkout not shown to guests",
    category: "Troubleshooting",
    subcategory: "Payments",
    summary:
      "In-app GeniusPay/Creem checkout is intentionally limited to ops staff; guests must share WhatsApp and pay the host manually.",
    tags: ["payments", "ops-only", "whatsapp"],
    featureStatus: "active",
    relatedFeatures: ["Manual booking", "GeniusPay"],
    relatedRoutes: ["/properties/[id]"],
    relatedFiles: [
      "property_app/utils/payments/paymentAccess.js",
      "property_app/utils/bookings/paymentMode.js",
      "property_app/app/api/bookings/request/route.js",
    ],
    relatedModels: ["Booking"],
    relatedApiEndpoints: [
      "POST /api/bookings/request",
      "POST /api/payments/geniuspay/initialize",
    ],
    content: `## What

Support may expect guests to pay by MoMo/card in the app. **Current code gates online checkout to ops roles only** (\`canUseOnlineCheckout\`).

## Why

Product decision for soft launch: hosts collect payment via WhatsApp/phone after a pending reservation.

## Who

Guests, hosts, and ops testing payments.

## How

1. Guest flow: Reserve/request → enter phone → pending booking → host contacts via WhatsApp helpers.
2. Ops testing online: sign in as \`admin\`/\`superadmin\`, enable gateway public flag, configure GeniusPay secrets, use initialize + webhook path.
3. If ops hits manual request API while gateway enabled, API returns 403 telling them to use online Reserve.

## Business rules

- Do not tell guests to “enable Flutterwave” — deprecated.
- Creem may be configured in env but is demoted versus GeniusPay for live preference.

## Technical implementation

\`paymentAccess.js\` ignores partner allowlists for now (parameter kept for future). UI badges/modals still read public gateway flags but server finalize enforces ops.

## Troubleshooting

- Ops cannot initialize → missing \`GENIUSPAY_*\` / gateway flag, or session not staff.
- Host never gets phone → guest skipped validation (should be impossible — API requires valid phone).
`,
  }),

  article({
    slug: "known-limitations",
    title: "Known limitations",
    category: "Known Limitations",
    subcategory: "Product",
    summary:
      "Honest inventory of partial, inactive, planned, and deprecated areas so ops does not promise features the code does not ship.",
    tags: ["limitations", "planned", "deprecated"],
    featureStatus: "partial",
    relatedFeatures: [],
    relatedRoutes: [],
    relatedFiles: [
      "property_app/utils/payments/paymentAccess.js",
      "property_app/utils/propertyRates.js",
      "property_app/utils/listings/catalogBeta.js",
      "property_app/docs/HANDOFF.md",
    ],
    relatedModels: [],
    relatedApiEndpoints: [],
    content: `## What

This article lists **real gaps** relative to a full Airbnb-style PMS. Status labels match \`featureStatus\` vocabulary.

## Why

Internal docs must not invent cleaner ops, open guest card checkout, or advanced search.

## Who

Ops, founders, support, and agents writing customer-facing copy.

## How / inventory

| Area | Status | Notes |
|---|---|---|
| Guest online MoMo/card | **Inactive** for guests | Ops-only via \`canUseOnlineCheckout\` |
| GeniusPay | **Active** (ops) | Preferred online rail |
| Creem | **Inactive** live emphasis | Code present; demoted vs GeniusPay |
| Flutterwave | **Deprecated** | Not offered in UI |
| Catalog public browse | **Partial** | Beta-closed by default |
| Full-text search | **Not implemented** | Browse/filters only |
| Cleaner / housekeeping ops | **Planned / not implemented** | 15% cleaning **fee** only |
| Automated host payouts | **Planned / partial** | IBAN stored; no payout engine |
| Guest–host chat threads | **Partial** | Message model + pages; not a full chat platform |
| Creator partnerships | **Active / partial** | Funnel + host codes + ledger; commercial fulfillment still human |
| Multi-currency settlement | **Partial** | Display FX + GeniusPay charge FX; accounting is USD-centric snapshots |

## Business rules

- Prefer WhatsApp + manual payment language in guest support macros.
- Never promise cleaner dispatch from Isisel ops tools — it does not exist in code.

## Technical implementation

Re-read \`paymentAccess.js\`, \`catalogBeta.js\`, \`propertyRates.js\` (\`CLEANING_FEE_RATE\`) before changing this list.

## Troubleshooting

If a screenshot shows a feature not listed as active, verify branch/deploy skew (see \`current-platform-status\`).
`,
  }),

  article({
    slug: "current-platform-status",
    title: "Current platform status",
    category: "Updates / Changelog",
    subcategory: "Status",
    summary:
      "Snapshot of what is live in code for version 1.1.0: working areas, soft-launch gates, and payment posture.",
    tags: ["status", "changelog", "1.1.0"],
    featureStatus: "active",
    relatedFeatures: [],
    relatedRoutes: ["/", "/host", "/ops", "/influencers"],
    relatedFiles: [
      "property_app/VERSION",
      "property_app/package.json",
      "property_app/docs/HANDOFF.md",
      "property_app/utils/payments/paymentAccess.js",
    ],
    relatedModels: [],
    relatedApiEndpoints: [],
    content: `## What

**App version:** \`1.1.0\` (\`VERSION\` / \`package.json\`).  
**Docs seed:** \`1.1.0-docs-1\`.

This is a **code-derived** status board for ops — not a marketing changelog.

## Why

Deploy skew and soft-launch flags make “is it live?” ambiguous; this page states intended behavior of the current codebase.

## Who

Ops leads and engineers resuming work after pauses.

## How — active now

- Next.js marketplace app with Google auth + ops credentials
- Host console (home, reservations, calendar, listings, creators, messages)
- Ops console (users, listings, reservations, analytics, marketing CRM, founding hosts)
- Manual booking requests with guest phone / WhatsApp arrangement
- Availability blocks + custom day rates
- Cloudinary media, Resend email, optional web push
- Creator lead funnel (\`/influencers\`) + host promo codes / commission ledger
- In-app messaging + ops broadcast
- Docker + Vercel deploy paths; Atlas keep-warm cron

## Soft-launch gates

- Listing **catalog beta** closed by default
- **Online checkout ops-only** (GeniusPay preferred when enabled)
- Guests: WhatsApp + manual payment

## Demoted / deprecated

- Creem: kept in codebase, not the preferred live guest rail
- Flutterwave: deprecated

## Planned / not shipped

- Cleaner management / housekeeping dispatch
- Fully automated host payout execution
- Open public guest gateway checkout (until \`canUseOnlineCheckout\` is widened)

## Business rules

Treat \`docs/HANDOFF.md\` as historical operational context; prefer this article + code for feature truth.

## Technical implementation

Update this article when payment access, catalog beta default, or major console IA changes.

## Troubleshooting

Production not matching this page → confirm which Git SHA / Vercel deployment is live.
`,
  }),

  article({
    slug: "cleaning-fee-not-cleaner-ops",
    title: "Cleaning fee vs cleaner operations",
    category: "Cleaning & Property Operations",
    subcategory: "Fees",
    summary:
      "Cleaning is a 15% fee on accommodation only. There is no cleaner staffing, scheduling, or property-ops module — that work is Planned / not implemented.",
    tags: ["cleaning-fee", "fees", "planned", "not-implemented"],
    featureStatus: "planned",
    relatedFeatures: ["Booking fee breakdown"],
    relatedRoutes: ["/properties/[id]", "/host/reservations"],
    relatedFiles: [
      "property_app/utils/propertyRates.js",
      "property_app/components/dynamicComponents/RightColumn.jsx",
      "property_app/models/Booking.js",
      "property_app/models/Transaction.js",
    ],
    relatedModels: ["Booking", "Transaction"],
    relatedApiEndpoints: [
      "POST /api/bookings/request",
      "POST /api/payments/geniuspay/initialize",
    ],
    content: `## What

On every priced stay, Isisel calculates:

- **Cleaning fee** = 15% of accommodation base (\`CLEANING_FEE_RATE = 0.15\`)
- **Platform commission** = default 7% of accommodation base (\`PLATFORM_COMMISSION_RATE\`), unless founding-host / custom rate applies

These amounts appear in the guest price breakdown and are stored on booking pricing snapshots / transactions as fee fields.

## Why

Hosts and guests need a predictable service fee line. That is **not** the same as managing cleaners.

## Who

Guests see the fee; hosts see it in reservation economics; ops must not confuse it with workforce tooling.

## How

\`calculateBookingFees(baseUsd)\` in \`utils/propertyRates.js\` returns \`{ base, cleaningFee, commission, total }\`. Checkout UIs (e.g. \`RightColumn.jsx\`) display the cleaning line. Payment metadata may include \`cleaning_fee_usd\`.

## Business rules

- Cleaning fee is **always a percentage fee in code**, not a vendor payout to a cleaner.
- **Cleaner management is NOT implemented** — no cleaner roles, schedules, checklists, or ops dispatch screens exist in \`property_app\`.
- Status for cleaner operations: **Planned / not implemented**.
- Do not tell hosts that Isisel will assign cleaners from the console.

## Technical implementation

Fee constants and math: \`property_app/utils/propertyRates.js\`. Snapshot fields: \`Booking.pricingSnapshot.cleaningFee\`, \`Transaction.cleaning_fee\`.

## Troubleshooting

- “Where do I assign a cleaner?” → You cannot in-product; use offline ops process. Product gap is acknowledged here.
- Fee looks wrong → confirm accommodation base after promo discount (cleaning is computed on discounted base in gateway pricing paths).
`,
  }),

  article({
    slug: "creators-promo-partnerships",
    title: "Creators, promos, and partnerships",
    category: "Host Console",
    subcategory: "Creators",
    summary:
      "Influencer lead funnel, host creator partners, promo codes, guest discounts, and commission ledger — present in code with human fulfillment.",
    tags: ["creators", "promo", "commission", "influencers"],
    featureStatus: "partial",
    relatedFeatures: [
      "Influencer landing",
      "Host creators program",
      "Promo attribution",
      "Commission ledger",
    ],
    relatedRoutes: [
      "/influencers",
      "/host/creators",
      "/creators/join/[token]",
      "/creators/portal/[token]",
      "/creators/console",
      "/ops/marketing/creators",
    ],
    relatedFiles: [
      "property_app/app/influencers/page.jsx",
      "property_app/utils/creators/commissionEngine.js",
      "property_app/utils/creators/promoAttribution.js",
      "property_app/utils/host/creatorsProgram.js",
      "property_app/utils/creators/creatorPortal.js",
      "property_app/components/ops/creators/OpsCreatorsWorkspace.jsx",
    ],
    relatedModels: [
      "CreatorLead",
      "CreatorFunnelEvent",
      "CreatorPartner",
      "CreatorPromoCode",
      "CreatorCommission",
    ],
    relatedApiEndpoints: [
      "POST /api/creators/leads",
      "POST /api/creators/events",
      "POST /api/creators/promo/validate",
      "GET/POST /api/host/creators",
      "GET /api/ops/creators/leads",
      "GET /api/ops/creators/commissions",
    ],
    content: `## What

Isisel has a **creator / influencer partnership** track:

1. **Public funnel** — \`/influencers\` lead form → \`CreatorLead\` + funnel events; ops CRM at \`/ops/marketing/creators\`.
2. **Host program** — hosts invite partners, issue **promo codes** (guest discount + creator commission rate), share portal/join tokens.
3. **Attribution** — bookings store creator fields; \`upsertCommissionForBooking\` maintains \`CreatorCommission\` ledger statuses (\`pending_stay\` → \`accrued\` → … → \`paid\`, plus holds/reversals).

## Why

Growth via creators while marketplace guest checkout stays manual/WhatsApp-first.

## Who

Creators (portal/console token access), hosts (\`/host/creators\`), ops (leads + commissions oversight).

## How

- Lead POST: \`/api/creators/leads\` (honeypot + rate limit patterns in route).
- Host APIs under \`/api/host/creators\` (+ codes, portal).
- Guest applies code at booking; \`promoAttribution\` validates and discounts accommodation base before fees.
- Training bookings do not create commissions.
- Paused partnerships are respected in portal logic (see creator portal utils).

## Business rules

- Guest promo discount is separate from platform commission (\`pricingSnapshot\` promo fields).
- Commission lifecycle is explicit — ops/host tooling advances statuses; **payout execution to creators may still be operational/manual** even when ledger says \`payable\`/\`paid\`.
- Influencer commercial terms/outreach remain largely human process on top of CRM.

## Technical implementation

Engine: \`utils/creators/commissionEngine.js\`. Models: \`CreatorPartner\`, \`CreatorPromoCode\`, \`CreatorCommission\`, \`CreatorLead\`, \`CreatorFunnelEvent\`.

## Troubleshooting

- Code invalid → expired, wrong property, archived partner, or validate API error.
- Commission missing → booking lacked attribution or was \`ops_training\` / voided.
`,
  }),

  article({
    slug: "messaging-guest-host-ops",
    title: "Messaging (guest, host, ops)",
    category: "Emails & Notifications",
    subcategory: "Messaging",
    summary:
      "In-app Message model for guest↔host property threads and ops→user account messages, with optional email notify and broadcast tools.",
    tags: ["messages", "inbox", "ops-broadcast"],
    featureStatus: "partial",
    relatedFeatures: [
      "Property contact messages",
      "Host inbox",
      "Ops messages",
      "Broadcast",
    ],
    relatedRoutes: ["/messages", "/host/messages", "/ops/messages"],
    relatedFiles: [
      "property_app/models/Message.js",
      "property_app/utils/actions/messageActions.js",
      "property_app/utils/email/sendOpsMessageEmail.js",
      "property_app/components/ops/OpsMessagesPanel.jsx",
      "property_app/components/ops/OpsBroadcastPanel.jsx",
      "property_app/utils/ops/broadcastAudience.js",
    ],
    relatedModels: ["Message", "User", "Property"],
    relatedApiEndpoints: [
      "GET/POST /api/ops/messages",
      "POST /api/ops/messages/broadcast",
    ],
    content: `## What

Isisel includes an **in-app messaging** system backed by the \`Message\` model: sender, recipient, optional \`property\`, contact fields, body, and \`read\` flag.

Surfaces:

- Guest \`/messages\`
- Host \`/host/messages\`
- Ops \`/ops/messages\` (+ broadcast)

Server actions in \`utils/actions/messageActions.js\` create/list/mark messages. Ops can message a user **without** a property (account message). Email notify via \`sendOpsMessageEmail\` when configured.

## Why

Hosts need a paper trail beyond WhatsApp; ops need to reach users who are not yet listed hosts.

## Who

Signed-in guests, hosts, and ops staff.

## How

1. Guest contacts host from a listing (propertyId required for non-ops).
2. Participants see threads in their inbox pages.
3. Ops panel lists/sends messages; broadcast selects audiences (\`broadcastAudience.js\`) and sends bulk ops messages/emails.
4. Unread counts feed host nav badges.

## Business rules

- Body max length enforced in actions (\`MESSAGE_BODY_MAX\`).
- Ops account messages allowed without property; regular users must include property.
- This is **not** a real-time chat platform (no websocket presence layer in code) — treat as asynchronous inbox.
- WhatsApp remains the primary **payment arrangement** channel (phone on booking), separate from Message docs.

## Technical implementation

Mongoose model \`Message\`. Revalidation paths: \`/messages\`, \`/host/messages\`, \`/ops/messages\`, and property pages.

## Troubleshooting

- Message send error “sign in” → no session.
- Ops email not arriving → Resend/ops from-address configuration.
- Broadcast empty audience → check audience filters in \`broadcastAudience.js\`.
`,
  }),
];
