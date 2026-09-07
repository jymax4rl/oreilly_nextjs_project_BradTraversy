# Isisel / Kama Properties — agent guide

Read **`property_app/docs/HANDOFF.md`** first. That file is the pause snapshot (2026-09-04) and the source of truth until the next handoff.

| | |
|---|---|
| **Production** | https://www.isisel.com |
| **GitHub** | https://github.com/jymax4rl/oreilly_nextjs_project_BradTraversy |
| **App (dev)** | `property_app/` → `npm run dev` |
| **Default git branch** | `master` (behind what is live) |
| **Vercel (isisel.com)** | project `kemika02` |

This folder is the Git root. The Cursor workspace parent (`KamaProperties052026/`) is not a Git repo.

## Pause (from 2026-09-04)

Owner is focused on **influencer / creator partnership revenue** for a few months. Prefer `/influencers` and ops creator CRM. Do not mix host-calendar, PWA, or marketplace refactors into that work unless the owner asks.

## Deploy

`npx vercel --prod --yes` from **this Git root** (not from `property_app/` — that nested root doubles the Vercel path).
