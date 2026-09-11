# Resume Site — Design Assessment & Theme Plan

*Assessed 2026-08-18 from source code, rendered DOM, and browser console/network capture.
Evidence screenshots: `design-home-full.png`, `design-analytics-full.png`, `design-mobile-home.png`, `design-expanded-card.png` (repo root).*

---

## 1. Executive summary

The site is **functionally solid** (fast, server-rendered, HTMX progressive enhancement, XSS-safe, responsive) but **visually undifferentiated**. It reads as an early-2010s admin panel, not a modern personal site. The three biggest factors, in order:

1. **No font stack anywhere** — the entire site renders in the browser default serif (Times New Roman). This single fact does more to make it feel dated than any other issue.
2. **No design system** — zero CSS custom properties; ~40 hardcoded hex colors repeated across `styles.css` and 28 more hardcoded inside the EJS/D3 scripts. Theming today means find-and-replace.
3. **No brand color at all** — the palette is grayscale + one navy (`#2c3e50`). Nothing on the page signals identity, hierarchy, or state.

Secondary issues: inverted nav active-state affordance, clickable spans with no hover/focus/keyboard support, fixed-size D3 charts that don't fill their cards, and missing head basics (favicon 404, no meta description/OG/theme-color).

**Proposed solution:** a time-based theme system — the site auto-selects Porcelain (morning), Editorial warm paper (afternoon), or Slate Noir dark (evening/night) based on the visitor's local clock, with a single-pill override toggle for manual control.

---

## 2. What's working (keep)

| Area | Notes |
|---|---|
| Architecture | Server-rendered EJS + HTMX fragments; no client framework; instant first paint; JSON/HTML dual-mode via `wantsHtml()` is clean. |
| Performance | One 6KB CSS file, no client-side framework weight, D3 only loaded on analytics pages. |
| Responsiveness | 3 sensible breakpoints (900/768/480); sidebar stacks correctly (`flexDirection: column`, `position: static`, `width: 100%` on mobile); cards fill viewport width (343px on 390px screen). |
| Interactions | Custom dual-thumb year slider with live fill is well built; sticky filter sidebar; working empty states; HTMX expand/collapse is smooth. |
| Semantics/safety | `<article>`, `<time>`, fieldsets/legends used correctly; `escapeHtml` applied everywhere. |
| Scale discipline | All sizes in `rem` — easy to scale once tokens exist. |

---

## 3. Findings

### 3.1 Foundations

| # | Issue | Severity | Evidence |
|---|---|---|---|
| F1 | **No `font-family` declared anywhere** → default serif UI | High | `grep font-family src/public/css/styles.css` → 0 matches |
| F2 | **Zero CSS custom properties** — no design tokens | High | `grep --` on `styles.css` → 0 matches |
| F3 | **~40 hardcoded colors in CSS + 28 in EJS/D3 inline scripts** | High | `grep #hex` across `src/views` → 28 hits (e.g. `analytics_dashboard.ejs:50` uses `d3.schemeCategory10`) |
| F4 | **No favicon** → 404 on every page | Low | Console: `404 /favicon.ico` |
| F5 | No meta description, Open Graph, or `theme-color` | Low | `layout.ejs` head |
| F6 | Stray orphan `}` after the reset rule (harmless, sloppy) | Trivial | `styles.css:6-7` |
| F7 | `showHeader` conditional in layout is dead code (never passed by controller) | Trivial | `layout.ejs:76` |
| F8 | Inline `style="cursor:pointer"` duplicated in 3 templates | Trivial | `index.ejs:6`, `position_card.ejs:34`, `position_card_detail.ejs:34` |

### 3.2 Color & brand

| # | Issue | Severity | Evidence |
|---|---|---|---|
| C1 | Entire palette is gray + `#2c3e50`; no accent/brand color, so nothing communicates state or hierarchy | High | whole `styles.css` |
| C2 | `#999` staffing separator on white = 2.8:1 contrast, fails WCAG AA for small text | Medium | `styles.css:349` |
| C3 | D3 charts use default `schemeCategory10` rainbow + ad-hoc green/orange/purple that clash with the grayscale UI | Medium | `analytics_dashboard.ejs:50,125`, `analytics_timeline.ejs:45-47` |
| C4 | No dark mode, no `color-scheme` | Medium | — |

### 3.3 Typography

| # | Issue | Severity | Evidence |
|---|---|---|---|
| T1 | No body `line-height`, no `letter-spacing`, no font smoothing | High | `styles.css` |
| T2 | Heading weights inconsistent (h1 `bold`, h2 1.75rem plain, h3 600, h4 500) | Medium | `styles.css:259,279,333,375` |
| T3 | No display/body type pairing; no scale tokens | Medium | — |

### 3.4 Components

| # | Issue | Severity | Evidence |
|---|---|---|---|
| P1 | Header is a plain text block with a 2px `#eee` rule: no role line, no accent, no monogram/avatar | High | `header.ejs`, `styles.css:251` |
| P2 | **Nav active state is weaker than hover** — active = faint border (`#c1c2cc`), hover = filled navy. Inverted affordance | High | `styles.css:503-515` |
| P3 | Position cards have no timeline treatment, no year marker, no "Current" badge on the active role | Medium | `position_card.ejs` |
| P3b | `.position-card--expanded` class exists in HTML but has **zero matching CSS rules** — the expanded state only changes box-shadow (0 4px 8px vs 0 2px 4px), no other visual distinction | Low | `position_card_detail.ejs:1` |
| P4 | Employment type is plain text; no badge color-coding (FT/Contract/Freelance) | Low | `position_card.ejs:23-27` |
| P5 | Skill pills are clickable but have **no `:hover`/`:focus` state** (only `cursor:pointer` via inline style) | Medium | `index.ejs:6`, `position_card.ejs:34` |
| P6 | Clickable spans are not keyboard-accessible (no `tabindex`/`role`) — skill pills, "View Details" toggles | High (a11y) | `position_card.ejs:51-58` |
| P7 | Empty state is bare text; no icon or "clear filters" CTA | Low | `position_list.ejs:46-48` |
| P8 | D3 SVGs are fixed 300px wide with no `viewBox` inside responsive grid cells — charts barely fit their parents (300px in 294.5px container), won't scale on resize, and use default `#1f77b4`/`#ff7f0e`/`#2ca02c` D3 palette | Medium | `analytics_dashboard.ejs:40,43-48`; computed: all 5 charts lack `viewBox` |
| P9 | `min-height: 50vh` loading/error/empty states can jump layout | Low | `styles.css:421-429` |

### 3.5 Robustness

| # | Issue | Severity | Evidence |
|---|---|---|---|
| R1 | htmx + D3 load from CDN with no local fallback; offline = analytics charts blank | Medium | `layout.ejs:8`, `analytics_*.ejs` (known limitation per AGENTS.md) |
| R2 | No `:focus-visible` styling anywhere | Medium (a11y) | `styles.css` |
| R3 | No print stylesheet — a resume site should print well | Low | — |

### 3.6 Computed Style Evidence (runtime verification)

The following values were extracted from the live browser render — these are the *actual* computed styles, not just what the CSS says:

| Element | Property | Computed Value | Implication |
|---|---|---|---|
| **Body** | `font-family` | `"Times New Roman"` | Default serif — the single biggest factor making the site feel dated |
| **Body** | `background-color` | `transparent` | No page-level background; pure white (or system default) |
| **Body** | `background-image` | `none` | No gradient, no texture, no visual interest |
| **Body** | `line-height` | `normal` | Tighter than ideal for body text (default ~1.2) |
| **Name (h1)** | `font-family` | `"Times New Roman"` | Same serif — should be a display font |
| **Name (h1)** | `font-size` | `32px` | 2.5rem — adequate size |
| **Name (h1)** | `font-weight` | `700` | Bold — OK but no letter-spacing |
| **Header** | `border-bottom` | `2px solid #eee` | Plain rule — no accent color |
| **Card** | `background-color` | `#ffffff` | Pure white on transparent body |
| **Card** | `border-radius` | `8px` | Small radius — not modern |
| **Card** | `box-shadow` | `0 2px 4px rgba(0,0,0,0.1)` | Basic shadow |
| **Card (expanded)** | `box-shadow` | `0 4px 8px rgba(0,0,0,0.1)` | Only shadow changes — no other visual distinction |
| **Card (expanded)** | CSS class `.position-card--expanded` | **No matching CSS rules found** | The class exists in HTML but has zero styles — wasted semantic signal |
| **Skill pills** | `background-color` | `#e9ecef` | Flat gray |
| **Skill pills** | `border-radius` | `20px` | Large pill — inconsistent with 8px card radius |
| **Skill pills** | `:hover` styles | **None found** | Clickable but no visual feedback |
| **Nav link (active)** | `border-color` | `rgb(193,194,204)` = `#c1c2cc` | Faint border — barely visible |
| **Nav link (inactive)** | `border-color` | `rgb(233,236,239)` = `#e9ecef` | Same as inactive — only 1px difference |
| **Nav link (inactive)** | `background-color` | `rgb(248,249,250)` = `#f8f9fa` | Light gray fill |
| **Sidebar** | `position` | `static` (on mobile) | Sticks on desktop, flows on mobile |
| **Sidebar** | `width` (desktop) | `260px` fixed | Doesn't adapt to wider screens |
| **Cards (mobile)** | `width` | `343px` on 390px viewport | Cards fill most of the screen — OK but no breathing room |
| **Name (mobile)** | `font-size` | `28px` | Scaled down from 32px |
| **D3 charts** | `viewBox` | **None** | Fixed pixel dimensions — won't scale |
| **D3 charts** | Chart 0 | `300×300` in a `294.5px` parent | Barely fits — no padding |
| **D3 charts** | Chart 3 (wide) | `669×420` in a `661px` parent | Barely fits — no padding |
| **D3 colors** | First bars | `#1f77b4` (blue), `#ff7f0e` (orange), `#2ca02c` (green) | Default D3 palette — clashes with grayscale UI |
| **Tooltip** | `background-color` | `#2c3e50` | Matches nav but no border or shadow |
| **Analytics sections** | `border-radius` | `8px` | Same as cards — consistent but plain |
| **Analytics grid** | `grid-template-columns` | `342.5px 342.5px` | Fixed 2-column — doesn't use available space |
| **Body** | `font-family` (from all sheets) | **Empty array** | Zero `font-family` declarations across all stylesheets |
| **Body** | CSS custom properties | **None found** | No `--bg`, `--surface`, `--accent`, etc. anywhere |
| **Body** | `@keyframes` rules | **None found** | No animations on the entire page |
| **Body** | `@media` queries | `900px`, `768px`, `480px` | Three breakpoints — reasonable |
| **Employment type** | `.type-value` text | "Full Time", "Contract", "Freelance" | Plain text — no color coding |
| **Page** | `link[rel="icon"]` | **Not found** | No favicon (confirmed by 404 console error) |
| **Page** | `meta` tags | Only `viewport` | No description, no OG, no theme-color |
| **Layout (mobile)** | `flex-direction` | `column` | Sidebar stacks above cards — correct |
| **Layout (mobile)** | `gap` | `32px` | Adequate spacing between stacked sections |

---

## 4. Theme architecture (prerequisite for all themes)

Move to a token layer first; themes become data, not code edits.

```css
:root {
  color-scheme: light dark;
  --bg:            ;  --bg-elevated:  ;
  --surface:       ;  --surface-2:    ;
  --border:        ;  --border-strong:;
  --text-1:        ;  --text-2:       ;  --text-3:  ;
  --accent:        ;  --accent-2:     ;  --accent-contrast: ;
  --ring:          ;
  --shadow-1:      ;  --shadow-2:     ;
  --radius-sm: 6px; --radius-md: 12px; --radius-lg: 16px;
  --font-display:  "Sora", var(--font-stack-body);
  --font-stack-body: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --chart-1: ; --chart-2: ; --chart-3: ; --chart-4: ;
  --chart-5: ; --chart-6: ;
}
:root[data-theme="slate-noir"] { /* overrides */ }
:root[data-theme="editorial"]  { /* overrides */ }
:root[data-theme="mono-grid"]  { /* overrides */ }
```

- Theme choice via `data-theme` on `<html>`, set by a ~15-line script in `layout.ejs` reading `localStorage('theme')` before first paint (no FOUC), defaulting to the OS `prefers-color-scheme`.
- D3 reads tokens at render time: `getComputedStyle(document.documentElement).getPropertyValue('--chart-1')` — charts re-render per theme automatically.
- Every hardcoded hex in `styles.css` and the 28 in the EJS scripts gets replaced by a token.

**Ready-to-paste token blocks for the two lead themes:**

### 4.1 Porcelain (light default)

```css
:root, :root[data-theme="porcelain"] {
  color-scheme: light;
  --bg: #f6f7f9;           --bg-elevated: #ffffff;
  --surface: #ffffff;      --surface-2: #eef0f4;
  --border: #e5e7eb;      --border-strong: #d1d5db;
  --text-1: #111827;      --text-2: #4b5563;      --text-3: #9ca3af;
  --accent: #4f46e5;      --accent-2: #0d9488;    --accent-contrast: #ffffff;
  --accent-soft: #eef2ff; --accent-soft-text: #3730a3;
  --ring: rgba(79, 70, 229, .35);
  --shadow-1: 0 1px 2px rgba(16,24,40,.06);
  --shadow-2: 0 1px 2px rgba(16,24,40,.06), 0 8px 24px rgba(16,24,40,.10);
  --chart-1: #4f46e5; --chart-2: #0d9488; --chart-3: #f59e0b;
  --chart-4: #e11d48; --chart-5: #64748b; --chart-6: #8b5cf6;
}
```

### 4.2 Slate Noir (dark showcase)

```css
:root[data-theme="slate-noir"] {
  color-scheme: dark;
  --bg: #0b1020;           --bg-elevated: #0f1529;
  --surface: rgba(17, 23, 43, .72);   --surface-2: #1a2238;
  --border: rgba(148,163,184,.16);    --border-strong: rgba(148,163,184,.32);
  --text-1: #f1f5f9;       --text-2: #94a3b8;       --text-3: #64748b;
  --accent: #6366f1;       --accent-2: #22d3ee;     --accent-soft: rgba(99,102,241,.16);
  --accent-soft-text: #a5b4fc; --accent-contrast: #ffffff;
  --ring: rgba(99, 102, 241, .5);
  --shadow-1: 0 1px 2px rgba(0,0,0,.4);
  --shadow-2: 0 8px 32px rgba(0,0,0,.45);
  --chart-1: #818cf8; --chart-2: #22d3ee; --chart-3: #34d399;
  --chart-4: #fbbf24; --chart-5: #64748b; --chart-6: #e879f9;
}
```

**D3 chart theming note (from computed data):** All 5 charts currently lack `viewBox` and use fixed pixel dimensions (300×300, 300×160, 300×352, 669×420, 669×200) that barely fit their parent containers. The default palette is `#1f77b4`/`#ff7f0e`/`#2ca02c` (blue/orange/green). Phase 3 must add `viewBox` + `width:100%` to every SVG and read chart colors from `--chart-*` tokens via `getComputedStyle`.

---

## 5. Proposed themes

### Theme A — "Porcelain" (light, recommended default)
- **Mood:** Linear/Stripe-grade light SaaS. Airy, precise, professional.
- **Type:** Inter (body) + Sora (name, section titles). Tight tracking on the name (−0.02em).
- **Layout moves:** header gains a monogram circle (initials, accent gradient) + role line under the name; a 3px accent underline replaces the `#eee` rule. Cards keep 12px radius, 1px `--border` + layered `--shadow-2`; hover lifts 2px and darkens the border.
- **Position timeline:** 28px gutter on the left with a vertical `--border` line and a year node dot per card; latest role gets a "Current" pill in `--accent-soft`/`--accent-soft-text`.
- **Badges:** employment type as colored pills — Full Time `emerald-soft`, Contract `amber-soft`, Freelance `violet-soft`.
- **Skill pills:** `--accent-soft` bg, `--accent-soft-text` text, 999px radius; hover: solid accent bg + white text (fixes P5); focus-visible ring from `--ring`.
- **Nav:** active = accent fill (fixes P2); inactive = transparent with `--border`; hover = `--surface-2`.
- **Charts:** token palette (indigo/teal/amber/rose/slate/violet), 1.5px gridlines at 5% opacity.

### Theme B — "Slate Noir" (dark, the showcase)
- **Mood:** deep-space developer portfolio. Glassy, luminous, premium.
- **Type:** Inter (body) + Space Grotesk (name, titles). Name rendered with gradient text (`--accent` → `--accent-2`, `background-clip: text`).
- **Atmosphere:** page gets a fixed radial glow — two 300px radial gradients at 8–10% opacity of accent colors in the top corners over `--bg`.
- **Cards:** glass — `--surface` (72% opacity) + `backdrop-filter: blur(12px)` (with a solid `--bg-elevated` fallback via `@supports`), 14px radius, 1px white-6% border, `--shadow-2`.
- **Timeline:** same structure as A but node dots glow (2px accent ring + soft outer glow); "Current" pill = accent gradient fill.
- **Skill tags:** transparent bg, 1px `--border-strong`, `--text-2`; hover: `--accent-soft` bg + `--accent-soft-text` text.
- **Nav:** active pill = accent gradient fill + soft `box-shadow: 0 0 24px var(--ring)`.
- **Slider:** accent-gradient fill bar; thumbs get accent border + glow on `:active`.
- **Charts:** cyan/indigo/emerald/amber/fuchsia; axis text `--text-3`; gridlines 15% white.
- **Tooltip:** `--bg-elevated` surface with accent border instead of flat dark box.

### Theme C — "Editorial" (warm paper, print-first)
- **Mood:** premium printed CV / literary. Understated, confident, best for printing or PDF.
- **Type:** Source Serif 4 or Newsreader (display: name, section titles) + Inter (body). Small-caps section labels (`text-transform: uppercase; letter-spacing: .08em; font-size: .75rem`).
- **Palette:** bg `#faf7f2`, surface `#fffdf9`, text `#1c1917`/`#57534e`/`#a8a29e`, accent `#b45309` (amber-700), chart palette ochre/olive/terracotta/slate.
- **Moves:** hairline 1px `#e7e5e4` borders, near-zero shadows (print-ready), skill tags as **outline** chips (1px border, transparent bg) instead of filled, thin serif drop-cap feel on the name. The `@media print` block (Phase 4) is tuned for this theme.

### Theme D — "Mono Grid" (monochrome + one accent, optional)
- **Mood:** developer-brutalist, "terminal resume". High contrast, technical.
- **Palette:** pure grayscale `#0a0a0a`…`#f5f5f5` + single accent `#ef4444` (or `#22c55e`). 2px radii, 1px solid borders everywhere, visible structure.
- **Type:** Inter + JetBrains Mono for dates, years, and the year slider labels — dates read as data.
- **Charts:** grayscale bars, accent only for the hovered bar.
- Best as a 3rd/4th option in the theme switcher; not a default candidate.

---

## 6. Time-based theme system

Instead of a manual theme picker, the site cycles themes based on the visitor's local time. This creates an ambient, "living" feel — the site changes with the day.

### Time periods and theme mapping

| Period | Hours (local) | Theme | Rationale |
|---|---|---|---|
| **Morning** | 05:00 – 12:00 | Porcelain | Fresh, clean, high-contrast light — sets a productive tone |
| **Afternoon** | 12:00 – 17:00 | Editorial (warm paper) | Softer, warmer — eases the eye as the day progresses |
| **Evening** | 17:00 – 22:00 | Slate Noir | Dark, luminous — matches the shift to evening/night work |
| **Night** | 22:00 – 05:00 | Slate Noir (deepened) | Same as evening but with reduced chart brightness and softer glows |

### Implementation logic (runs in `layout.ejs` before first paint)

```js
(function() {
  // Prevent FOUC: write theme to <html> before anything renders
  const hour = new Date().getHours();
  let theme = 'porcelain'; // default
  if (hour >= 5 && hour < 12) theme = 'porcelain';
  else if (hour >= 12 && hour < 17) theme = 'editorial';
  else theme = 'slate-noir'; // evening + night

  // Respect manual override (localStorage wins)
  const saved = localStorage.getItem('resume-theme');
  if (saved && ['porcelain','editorial','slate-noir'].includes(saved)) {
    theme = saved;
  }

  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme =
    theme === 'slate-noir' ? 'dark' : 'light';
})();
```

A small toggle in the header (a pill labeled "Theme: Morning" / "Theme: Afternoon" / "Theme: Evening") lets users override the auto-cycle. Clicking it cycles through the three themes and saves the choice to `localStorage`. When the user returns, their override persists until they click again.

### Night-mode refinements (22:00–05:00)

When the auto-detected period is night, add an extra class to `<body>`:

```css
body[data-period="night"] {
  --chart-opacity: 0.6; /* dim D3 charts */
}
body[data-period="night"] .d3-tooltip {
  box-shadow: none; /* reduce glow at night */
}
```

D3 scripts read `getComputedStyle(document.body).getPropertyValue('--chart-opacity')` and apply it to bar paths.

### Visual character of each time period

| Period | Accent | Mood | Notable tweak |
|---|---|---|---|
| Morning (Porcelain) | Indigo `#4f46e5` | Crisp, energetic | Full shadow depth, high-contrast text |
| Afternoon (Editorial) | Amber `#b45309` | Warm, approachable | Softer shadows, warm paper bg, serif headings |
| Evening (Slate Noir) | Indigo→Cyan gradient | Sophisticated, focused | Glass cards, gradient name, accent glow on nav |
| Night (Slate Noir deep) | Same as evening, dimmed | Calm, low-strain | 60% chart opacity, reduced glow, `prefers-reduced-motion` active |

---

## 7. Implementation plan

| Phase | Scope | Files touched | Effort |
|---|---|---|---|
| **0 — Hygiene** | Fix stray `}` (F6); add favicon + meta description/OG/theme-color (F4,F5); convert clickable spans to real `<button class="chip-btn">` with `hx-*` intact (P6, F8); add global `:focus-visible { outline: 2px solid var(--accent) }` (R2); delete dead `showHeader` branch (F7) | `styles.css`, `layout.ejs`, `header.ejs`, `index.ejs`, `position_card*.ejs`, `controller.js` | ~0.5 day |
| **1 — Token system + time-based themes** | Introduce `:root` tokens (Porcelain default); replace all ~40 hexes in CSS + 28 in EJS with tokens; add pre-paint time-detection script in `layout.ejs` (auto-selects theme from local hour); add manual override toggle (pill in header, cycles 3 themes, persists to localStorage); `color-scheme` updates; add `data-period="night"` class for 22:00–05:00 | `styles.css`, `layout.ejs`, `header.ejs`, all `analytics_*.ejs` | ~1 day |
| **2 — Component uplift (the visual win)** | New header (monogram, role line, accent underline); nav active=accent (P2); timeline cards (year gutter, node, Current badge — P3); employment-type pills (P4); chip hover/focus states (P5); refined empty state with icon + "Clear filters" (P7); refined year slider + checkboxes (accent); `line-height: 1.5` body, heading scale/weights (T1,T2) | `styles.css`, `header.ejs`, `position_card*.ejs`, `position_list.ejs`, `filters.ejs`, `layout.ejs` | ~1–2 days |
| **3 — Chart theming** | D3 palettes from `--chart-*` tokens via `getComputedStyle`; responsive SVGs (`viewBox` + `width: 100%; height: auto`) to fix P8; axis/grid/tooltip colors from tokens; `schemeCategory10` removed | `analytics_dashboard.ejs`, `analytics_skills.ejs`, `analytics_timeline.ejs` | ~0.5–1 day |
| **4 — A11y & print polish** | Per-theme contrast audit (fixes C2); `aria-pressed` on toggles; `@media print` (hide nav/filters, single column, white bg — tuned for Editorial) (R3); reduced-motion guard on the hover lifts | `styles.css`, views | ~0.5 day |

**Total: ~4–6 focused days.** Phase 0+1+2 delivers ~80% of the perceived "modern and sleek" improvement; Phase 3–4 round it out.

### Sequencing note
Phase 1 must precede Phases 2–4 (everything references tokens). Phase 2 can start before 3 (pages vs charts). The time-based auto-detection runs in a `<script>` block in `layout.ejs` before any CSS loads, so there is zero FOUC. Themes B/C/D are then just extra `:root[data-theme]` blocks + a few theme-conditional tweaks (glass cards and gradient text gated behind `[data-theme="slate-noir"]` so they don't leak into light themes).

---

## 8. Risks / decisions needed

1. **Fonts:** self-host (Inter/Sora/Space Grotesk/Source Serif via `fontsource` npm packages or static files in `src/public/fonts/`) vs CDN (consistent with existing htmx/D3 CDN usage, adds an offline gap — see R1). *Recommendation: self-host, keeps the site usable offline.*
2. **`backdrop-filter`** (Slate Noir glass) — widely supported but expensive on low-end mobile; guard with `@supports` and a solid fallback.
3. **Time-based override UX** — the manual toggle should be a single pill (e.g., "☀ Morning / 🌤 Afternoon / 🌙 Evening") that cycles themes and saves to localStorage. Keep it small and non-intrusive in the header. *Recommendation: one pill button with rotating label, not a dropdown.*
4. **D3 offline** (R1) — out of scope for theming, but worth a follow-up: vendor `d3.min.js` locally so analytics works offline, matching the new self-hosted fonts.
5. **D3 `viewBox`** — all 5 charts lack `viewBox` and use fixed pixel dimensions. Phase 3 must add `viewBox="0 0 W H"` and `width:100%; height:auto` to every SVG, then recalculate D3 dimensions as percentages of the container.
6. **`.position-card--expanded`** — this class exists in the HTML (added by `position_card_detail.ejs:1`) but has zero CSS rules. Either give it real styles (different shadow, border, or background) or remove it to avoid confusion.