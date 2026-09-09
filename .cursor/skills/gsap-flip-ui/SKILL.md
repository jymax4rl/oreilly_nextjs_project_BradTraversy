---
name: gsap-flip-ui
description: >-
  Use GSAP Flip as the standard coherent pattern for UI layout morphs,
  expands/collapses, card→modal previews, and shared-element transitions in
  property_app. Apply when changing homepage discovery, search shells, modals,
  galleries, or any layout that should feel continuous rather than fade/slide
  randomly. Prefer Flip over ad-hoc opacity/translate timelines for structural UI changes.
---

# GSAP Flip as the UI transition standard

When morphing layout in `property_app`, **GSAP Flip is the default** — not random fade/slide stacks.

Flip = **First → Last → Invert → Play**: measure before React commits the new layout, then animate to the new positions.

## When to use Flip

| Use Flip | Prefer simple tween instead |
|---|---|
| Compact ↔ expanded shells | Opacity-only overlays |
| Card / thumbnail → modal hero | Tiny tooltip fades |
| Shared-element image handoff | Spinner / progress |
| Grid ↔ detail layout morphs | Pure color changes |
| List item expanding in place | Micro-interactions (heart, focus ring) |

**Rule:** If the user’s eye should follow an element from A to B across a layout change, use Flip. If only atmosphere changes, a short `gsap.to` is fine.

## Coherence rules (do not improvise)

1. **One choreography language** — duration ~0.45–0.6s, `ease: "power2.inOut"` for structural Flip; content fade-in slightly after (`delay` 0.1–0.18, `power2.out`).
2. **Capture before React updates** — call `Flip.getState(...)` in the click/open handler (or right before `setState`), then run `Flip.from(state)` in `useLayoutEffect` after the new tree commits.
3. **React owns classes/visibility; Flip owns motion** — don’t toggle layout classes inside Flip helpers and also in React (double-apply kills the animation).
4. **Stable `data-flip-id`** (or a measured target node) for shared elements (card photo ↔ modal hero).
5. **Honor `prefers-reduced-motion`** — skip Flip; snap to the end state; still open/close correctly.
6. **Cleanup** — kill tweens on unmount / rapid re-open; unlock `document.body` scroll on close.
7. **Nesting** — for shells with inner map/widgets, use `nested: true` and fade inner panels after the shell Flip, not instead of it.
8. **Don’t Flip everything** — carousel slides, dropdowns, and form focus stay local; Flip is for layout identity.

## Canonical helpers

Prefer shared utils over one-off timelines:

- `property_app/utils/animations/homeDiscovery.js` — search shell expand/collapse
- `property_app/utils/animations/flipUi.js` — generic capture / from / modal open-close

```js
import {
  captureFlipState,
  runFlipFrom,
  prefersReducedMotion,
} from "@/utils/animations/flipUi";

// pointer handler (BEFORE setState)
pendingFlip.current = captureFlipState(sourceEl);

// after open state commits (useLayoutEffect)
runFlipFrom({
  flipState: pendingFlip.current,
  onComplete: () => focusCloseBtn(),
});
```

## Card → property preview modal (homepage pattern)

1. Capture **media rect** with `captureElementRect` / `captureCardFlipState` before `setState`.
2. Portal modal to `document.body` (escape stacking contexts / bottom nav).
3. `runModalMorphOpen` — FLIP-math expand of the **panel** from the card rect (no `absolute` Flip on shared IDs — that breaks the card).
4. Set `html[data-home-preview-open]` so `.kama-tabbar` slides down.
5. Always settle opacity/transform if the tween is killed mid-flight.
6. **Reserve** → `propertyPublicPath`. Close with `runModalMorphClose`.

## Anti-patterns

- Mixing 3+ unrelated easings on one interaction
- `Flip.getState` after React already applied the end layout (no motion)
- Remounting Google Maps / heavy iframes on every Flip frame
- Navigating away mid-Flip without killing tweens
- Dashboard-style split panes animated with random staggers instead of one Flip shell

## Checklist before shipping a Flip UI

- [ ] State captured before layout commit
- [ ] Reduced-motion path tested
- [ ] Focus trap + Escape on modals
- [ ] Mobile: bottom-sheet or full-bleed still Flips from the tapped card
- [ ] No layout thrash (fixed heights on morph targets when needed)
