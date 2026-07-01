# Tvastra (tvastrafit.com) — Theme Change Log

**Theme:** Hongo 1.4 · **Date:** 2026-07-01
**Active header config:** `header_layout: style-1`, `header_style: center-logo`
**Approach:** All visual changes are additive overrides in `assets/custom.css`
(loaded last, so they win without touching core files) plus two small Liquid
edits for the swatch removal. Every change is scoped and easy to revert.

> ⚠️ **These edits were made on a local/offline copy of the theme.** They have
> **not** been rendered or browser-tested. Upload to a **duplicate/preview theme**
> in Shopify and verify on desktop + mobile (and Chrome + Safari for the dropdown)
> before publishing to the live store.

---

## Task 1 — Slimmer navbar

**File:** `assets/custom.css` (new block: “Navbar slim-down, Shop dropdown fix & polish”)

| # | What changed | Before → After | Why |
|---|--------------|----------------|-----|
| 1 | Desktop nav-link vertical padding (drives header height) | `25px` top/bottom → **`16px`** | Header felt tall/bulky; this is the main lever for bar height. Scoped to `@media (min-width:1200px)` so the mobile off-canvas menu keeps its larger tap targets. |
| 2 | Sticky/fixed header nav-link padding | `20px` → **`12px`** | Keeps the shrunk proportions when the header is stuck on scroll. |
| 3 | Logo width (desktop) | `170px` → **`150px`** | Slight trim so the logo matches the shorter bar. Overrides the existing `--main-logo-width: 170px` rule. |
| 4 | Logo height cap (desktop) | none → **`max-height: 48px`, `width:auto`** | Guarantees the logo can’t re-inflate the bar regardless of its aspect ratio. |

All four values are exposed as CSS variables (`--tv-navlink-py`,
`--tv-navlink-py-sticky`, `--tv-logo-width-desktop`, `--tv-logo-max-height`) at
the top of the block for easy fine-tuning after you see it live.

*Not touched:* horizontal spacing between menu items (`margin: 0 16px`), so items
won’t overlap or get cut off. Mobile header untouched.

---

## Task 2 — “Shop” dropdown: all sub-options now visible

**File:** `assets/custom.css` (same block) · **Menu type:** “Shop” is a **megamenu** block.

**Root cause (all three suspects were in play):**
- Base `.megamenu` had `overflow: hidden` **and** `max-height: calc(100vh - var(--top-space))` → vertical clipping.
- An earlier custom rule set `.dropdown-menu.megamenu .row { flex-wrap: nowrap }` → extra columns overflowed to the right and got cut by the `overflow:hidden`.
- Low `z-index: 99` → possible stacking clip under sections below the header.

| What changed | Before → After | Why |
|--------------|----------------|-----|
| Megamenu height cap | `max-height: calc(100vh - var(--top-space))` → **`none`** | Menu sizes to its content; short menu, so no giant scroll list. |
| Megamenu overflow | `overflow: hidden` → **`visible`** | Stops both vertical and horizontal clipping of sub-items. |
| Megamenu stacking | `z-index: 99` → **`999`** | Rules out any overlap by sibling sections. |
| Column row wrapping | `flex-wrap: nowrap` → **`wrap`** (+ `row-gap:24px`) | Overflowing columns move to a new line instead of being clipped on the right. |

Scoped to `@media (min-width:1200px)` (desktop hover behaviour only).

**Verify:** hover “Shop” in Chrome **and** Safari and confirm every column/link
shows. If the menu ever grows very large in future, re-add a generous
`max-height` + `overflow-y:auto`.

---

## Task 3 — Remove color swatches on Olive Crop Top & Black Crop Top

**Important finding:** these are **not real Shopify variants**. They’re a
**custom-built swatch feature** that links separate products together as fake
“colour options.” **Removing them deletes zero product data** — it’s pure UI.
(This answers the hide-vs-delete question: there is nothing destructive here, and
no variant/option data was removed. The two products remain fully intact and
standalone.)

Two systems render these swatches; both are now suppressed for exactly the two
target handles and nothing else:

**File 1:** `snippets/color-swatches.liquid` (the small `.tv-dot` dots)
- **Before:** `group_black_olive = "black-crop-top-gym-wear|#000000,olive-crop-top-gym-wear|#4A4D3A"`
- **After:** group emptied (with a restore comment). Neither handle matches any group → no dots render for these two products. All other products’ swatches untouched.

**File 2:** `snippets/global-swatches.liquid` (metafield-driven dots/pills on cards)
- **Before:** rendered whenever the product had `custom.swatch_color` / `custom.sibling_products` metafields.
- **After:** added a handle guard — if the product handle is `black-crop-top-gym-wear` or `olive-crop-top-gym-wear`, `_show = false`. UI hidden regardless of metafields; **no metafields edited.**

**Handles used:** `black-crop-top-gym-wear`, `olive-crop-top-gym-wear` (taken from
the theme code). **Please confirm** these match the live product URLs
(`/products/<handle>`). If a handle differs, update the two lists.

**Also confirm on preview:** that these products don’t *also* carry a **native
Shopify color option** (a real variant picker). If they only ever showed the two
custom dots (black + olive), you’re done. If a native variant selector still
appears, that’s product data in the admin and is a separate decision (hiding all
native pickers site-wide is not recommended).

---

## Task 4 — General polish (conservative, safe defaults)

**File:** `assets/custom.css` (same block)

| What changed | Detail | Why |
|--------------|--------|-----|
| Consistent transitions | Added smooth `.2s` transitions on `.btn`, nav links, megamenu links | Hover/color changes feel intentional, not abrupt/default. |
| Button hover lift | `.btn:hover { transform: translateY(-1px) }` | Subtle, deliberate affordance. |
| Accessible focus ring | `:focus-visible` outline in brand gold on links/buttons | Professional a11y touch most themes omit; only shows for keyboard users. |

**Deliberately conservative:** deeper spacing/typography restructuring is risky to
do blind (no visual feedback on an offline copy) and could destabilise the live
layout. Recommend a focused visual polish pass **on the preview theme** once the
above is confirmed — I can then target real inconsistencies precisely.

---

## Files changed (summary)

| File | Task(s) | Nature |
|------|---------|--------|
| `assets/custom.css` | 1, 2, 4 | New appended override block (revert = delete the block) |
| `snippets/color-swatches.liquid` | 3 | Emptied `group_black_olive` (restore comment left in place) |
| `snippets/global-swatches.liquid` | 3 | Added 2-handle suppression guard |

## Recommended testing checklist (on a duplicate theme)

- [ ] Desktop navbar looks sleeker; logo crisp and vertically centered; no item overlap.
- [ ] Mobile header + off-canvas menu unchanged and fully usable.
- [ ] Hover “Shop” on desktop (Chrome **and** Safari) → every sub-option visible.
- [ ] Olive Crop Top & Black Crop Top pages/cards → no colour swatches; other products still have theirs.
- [ ] Buttons/links hover smoothly; keyboard `Tab` shows a focus ring.
- [ ] Publish only after the above pass.
