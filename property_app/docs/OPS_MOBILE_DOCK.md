# Ops mobile dock — approved design (locked)

**Status:** Approved by product owner on **2026-09-10**. Do not replace with `position: fixed` / floating pill / content-footer chrome.

**Git pin:** tag `ops-mobile-dock-approved-2026-09-10` → commit `b801815`  
**Visual:** `docs/ops-mobile-dock-preview.png`  
**Regression test:** `npm run test -- components/ops/ops-mobile-dock.contract.test.mjs` (also in `npm test`)

## Why this shape

Earlier `position: fixed` docks failed in the installed PWA: iOS treated them as content-relative whenever an ancestor used overflow clipping. The approved design uses an **in-flow flex footer** inside a viewport-locked shell so the bar cannot drift to the bottom of the page.

## Required architecture

```
main#main-content          (h-dvh, overflow hidden on /ops + /documentation)
  └─ .ops-app              (flex column, height 100%, overflow hidden)
       ├─ OpsNav           (mobile top bar + desktop rail)
       ├─ .ops-app-main    (flex 1, overflow-y auto)  ← only scroll region
       └─ OpsMobileDock    (.ops-dock)                ← in-flow footer
```

### Hard rules (do not break)

1. **Dock is a flex sibling after `.ops-app-main`**, not `position: fixed` on `.ops-dock`.
2. **Only `.ops-app-main` scrolls.** `.ops-app` stays `overflow: hidden`.
3. **Safe area** is padding on `.ops-dock` via `env(safe-area-inset-bottom)`.
4. **More sheet** may portal to `document.body`; the dock itself must not.
5. **Desktop (≥1024px)** hides the dock; side rail remains.

## Visual spec

| Token | Value |
|---|---|
| Background | `#0c0c0c` |
| Inactive text | `#a8a8a8` |
| Active text | `#f4f4f4` |
| Active icon accent | `#2f8f86` |
| Top hairline | `rgba(255,255,255,0.1)` |
| Tab row min-height | `3.35rem` (+ safe area) |

**Primary tabs:** Home · Stats · Listings · Stays · More  
Config: `components/ops/opsNavItems.js`

## Source files

| File | Role |
|---|---|
| `components/ops/OpsShell.jsx` | Viewport shell layout |
| `components/ops/OpsMobileDock.jsx` | Dock + More sheet |
| `components/ops/ops-mobile-dock.css` | Dock styles |
| `components/ops/opsNavItems.js` | Shared nav items |
| `components/ops/charts/ops-charts.css` | `.ops-app` / `.ops-app-main` |
| `components/MainShell.jsx` | Ops viewport lock on `/ops` (not login) + `/documentation` |

## If someone “fixes” sticky again

Do **not** reintroduce `position: fixed` on the dock. Re-read this doc and the contract test. Restore from tag:

```bash
git checkout ops-mobile-dock-approved-2026-09-10 -- \
  property_app/components/ops/OpsShell.jsx \
  property_app/components/ops/OpsMobileDock.jsx \
  property_app/components/ops/ops-mobile-dock.css \
  property_app/components/ops/opsNavItems.js
```
