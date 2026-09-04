# Engineering docs

## Pause / resume (agents and humans)

| File | Purpose |
|------|---------|
| `HANDOFF.md` | **Read first.** 2026-09-04 snapshot: production vs git, influencer track, uncommitted work |

## Project status (advancement & next steps)

| File | Purpose |
|------|---------|
| `kama-properties-project-status.html` | Source report (edit this) |
| `kama-properties-project-status.pdf` | Generated status PDF |

Regenerate PDF:

```bash
npm run docs:project-status-pdf
```

## Platform track record

| File | Purpose |
|------|---------|
| `kama-properties-track-record.html` | Platform overview source |
| `kama-properties-track-record.pdf` | Generated track record PDF |

```bash
npm run docs:track-record-pdf
```

## Availability calendar (Phase 1)

| File | Purpose |
|------|---------|
| `availability-calendar-design.md` | Source design (edit this) |
| `availability-calendar-design.html` | Print-friendly layout (browser → Save as PDF) |
| `availability-calendar-design.pdf` | Generated design PDF |

Regenerate PDF:

```bash
node scripts/generate-availability-design-pdf.mjs
```
