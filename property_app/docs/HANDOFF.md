# Isisel pause snapshot — 4 September 2026

Owner is pausing marketplace UI work for **a few months** to earn through **influencer / creator partnerships**. This file is the resume packet for humans and Cursor agents.

Live product: **https://www.isisel.com**  
GitHub: **https://github.com/jymax4rl/oreilly_nextjs_project_BradTraversy**  
Next.js app: **`property_app/`** (`npm run dev` here)

---

## Critical: Git is not the live site

| Layer | What is actually there (2026-09-04) |
|---|---|
| **Guests see** | Vercel project **`kemika02`**, custom domain www.isisel.com. Recent updates were **CLI deploys** of the local working tree (`npx vercel --prod --yes`). |
| **Git `master`** | `e079466` — Cloudinary AI photo enhance. **Older than production.** |
| **Local branch** | `feature/pwa-floating-tabbar` at `79a4b44` (host stay calendar modernize) **plus uncommitted files** listed below. |
| **This branch vs origin** | No upstream tracking; **not pushed**. |

If Vercel Git integration rebuilds from `master`, production can **roll back** and wipe the host console, calendar, influencers page, PWA chrome, and about/investors work that never landed on `master`.

**Before leaving this machine:** commit the working tree, push the branch, and do not merge to `master` unless you intend that commit to be the production source of truth.

### Deploy (do this, not the other)

```bash
# cwd = oreilly_nextjs_project_BradTraversy  (Git root)
npx vercel --prod --yes
```

Do **not** run that from `property_app/`. A nested Vercel root becomes `property_app/property_app` and the build breaks. Legacy Vercel project `oreilly-nextjs-project-brad-traversy` is **not** www.isisel.com.

### Production env (Vercel → kemika02)

- `NEXT_PUBLIC_SITE_URL` = `https://www.isisel.com`
- `NEXT_PUBLIC_DOMAIN` = `https://www.isisel.com`
- `NEXTAUTH_URL` = `https://www.isisel.com`
- Google OAuth callback: `https://www.isisel.com/api/auth/callback/google`
- Code fallbacks already use `https://www.isisel.com` (never `kamaproperties.com`).

Local: `NEXTAUTH_URL=http://localhost:3000` in `property_app/.env`.

---

## Influencer money track (default work from here)

Public funnel and ops CRM **already exist**. Build commercial terms, outreach, and fulfillment on top of this — do not rebuild the landing as a copy of `/business`.

| Piece | Path |
|---|---|
| Public page | https://www.isisel.com/influencers |
| Page + copy | `property_app/app/influencers/page.jsx`, `content.js` |
| UI | `property_app/components/creators/CreatorLanding.jsx`, `CreatorDiscuss.jsx`, `creator.css` |
| Lead POST | `POST /api/creators/leads` → `property_app/app/api/creators/leads/route.js` |
| Funnel events | `POST /api/creators/events` |
| Mongo | `CreatorLead`, `CreatorFunnelEvent` |
| Ops inbox | `/ops/marketing/creators` → `CreatorLeadsPanel.jsx` |
| Stages | `new → contacted → discussing → proposed → negotiating → active → completed` / `not_fit` (`utils/creators/constants.js`) |
| Notify | Resend via `utils/creators/notify.js` (needs verified `isisel.com` sending domain) |
| Pitch PDF | `property_app/docs/kama-mvp-influencer-stay.html` / `.pdf` |

Lead form: name + email required; platform / profile / message optional; honeypot + origin check + rate limit. Source field is `"influencers"`.

**New influencer work:** finish and push the current branch first, then `feature/…` from the agreed tip. Do not dump partnership experiments onto `feature/pwa-floating-tabbar`.

---

## Uncommitted working tree (must not be lost)

Branch: `feature/pwa-floating-tabbar`

Modified:

- `property_app/app/api/properties/[id]/bookings/[bookingId]/route.js` — `revalidateHostOps()` after booking PATCH
- `property_app/app/host/page.jsx` — Host Home
- `property_app/assets/styles/globals.css`
- `property_app/components/MobileBottomNav.jsx` + **new** `mobile-bottom-nav.css`
- `property_app/contexts/ScrollNavContext.jsx`
- `property_app/components/host/HostHomeView.jsx` — re-export of `./home/HostHomeView`
- **new** `property_app/components/host/home/HostHomeView.jsx` + `host-home.css`
- `property_app/components/host/HostNav.jsx` — replay Home rings
- `property_app/components/host/calendar/HostReservationsCalendar.jsx` + `reservations-calendar.css`
- `property_app/components/about/AboutLanding.jsx`, `investors/InvestorLanding.jsx`
- **new** `HospitalitySystemsStrip.jsx`, `utils/hospitalitySystems.js`
- `property_app/components/creators/creator.css`
- `property_app/lib/i18n/messages.js`

Ignore `.next/` cache if it appears dirty.

---

## What production already has (beyond `master`)

Shipped on various branches / CLI deploys, not all merged to `master`:

- Host console (`/host`, `/host/calendar`, `/host/reservations`, listings)
- Stay calendar: drag between listings (future stays only), date resize, EN/FR, mobile grip = Lucide `MoveVertical`, thicker end caps on resize hover
- Host Home rings: Arrivals (check-in today, pending+confirmed), Departures (check-out today, **confirmed only**), In stay, Needs you
- Guest PWA floating tab bar (frost glass; **hidden at `min-width: 1024px`**). Host uses top `HostNav`.
- `/influencers` + creator CRM; `/about`; `/investors`; Accor/IHG/Mews/OPERA wordmark strip (**no “not partners” disclaimer** — owner rejected that)
- Listing slugs, SEO, booking emails, Flutterwave / GeniusPay, ops console, coming-soon gate, etc. on other branches

### Host Home count rules (easy to break)

- **Arrivals** = check-in **today**, pending + confirmed
- **Departures** = check-out **today**, **confirmed only**
- **In stay** = confirmed, `checkIn < today && checkOut > today`
- Dragging a stay on the calendar must revalidate `/host` or the rings stay stale

### Stay calendar rules

- Vertical move: 2+ listings, no single-listing filter, check-in **not before today**
- Horizontal resize: start edge only if check-in ≥ today; end edge if check-out > today
- `MoveVertical` shows on multi-listing calendar for active stays; dimmer when the stay cannot move (`data-locked`)

---

## Keep the app running while you are away

Atlas **Free (M0)** clusters pause after **30 days with zero connections**. That is why the site can look dead after you ignore it: Vercel is still up, Mongo is paused, listings/auth/leads all 500. Atlas emails you a week before pause.

`GET /api/health/db` runs `{ ping: 1 }` against Mongo. `property_app/vercel.json` schedules it **daily at 09:00 UTC**. That counts as activity. Needs one production deploy to start. `/api/health` is still a cheap liveness check and does **not** touch Mongo (Docker).

1. **Do not merge stale `master` over production.** Treat `kemika02` CLI deploys as live until git catches up.
2. **Do not let Vercel/Mongo/Cloudinary/Resend/Google OAuth billing or DNS lapse.**
3. **Resend:** `isisel.com` must stay verified or creator-lead and booking mail fail (local 403 was seen when unverified).
4. **Do not “clean up” the hospitality strip** by adding partnership disclaimers.
5. **Desktop tab bar:** `.kama-tabbar { display: flex }` beats Tailwind `lg:hidden` — keep the `min-width: 1024px { display: none !important }` rule in `mobile-bottom-nav.css`.
6. **Leave marketplace alone** unless a production fire. Default new work is influencer revenue.

Dev: from `property_app/`, `npm run dev` (Turbo). Next may warn about `127.0.0.1` HMR (`allowedDevOrigins`); use `localhost:3000` if that bites.

---

## Cursor workspace (not in Git)

Parent folder `KamaProperties052026/` holds:

- `.cursor/rules/` — always-on product + git rules
- `.cursor/context/project-snapshot.md` — should match this handoff
- `.cursor/context/git-snapshot.md` — rewritten each Agent `sessionStart` (often stale)

A copy of the pause rule also lives in **this Git repo** at `.cursor/rules/pause-resume-2026.mdc` so clones still see it.

---

## Resume checklist (when marketplace work starts again)

1. Read this file and `git status` in `oreilly_nextjs_project_BradTraversy`.
2. Confirm www.isisel.com still matches the intended working tree.
3. Commit/push any leftover WIP; new features on a **new** branch.
4. Point `master` at production only with an intentional merge/deploy plan.
5. Delete or archive this snapshot when it is no longer true.
