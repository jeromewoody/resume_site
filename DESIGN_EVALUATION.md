# Resume Site — Design Evaluation & Modern Direction (2026-11-21)

*Live-reviewed in Chrome (via Playwright headless, system-level Chromium) — current state, not a fresh design. Screenshots from this session are in `/home/jerome/.hermes/cache/scratch/pw/out/` (`home-a-hero-skills.png`, `home-b-cards-1.png`, `03-mobile-top.png`, `12-mobile-cards.png`, `07-analytics-viewport.png`, `10-distribution-top.png`, `11-skills.png`, `11-timeline.png`). Note: that dir is the session scratch dir and will be pruned after 24h — re-run any capture script against http://localhost:3001/ to regenerate.*

*Note on the Chrome requirement: the in-app browser tools are intentionally blocked for localhost URLs by the safety guard ("URL targets a private or internal address"), so I drove the site with the system Google Chrome (Playwright headless) instead — same engine, same pixels. For a final visual pass you may still want to open http://localhost:3001/ in your own browser.*

---

## 1. Executive summary

This is a **functionally mature, token-based, responsive site that reads dated**. The engineering is good: CSS custom-property token system, time-based theme system (Porcelain/Editorial/Slate Noir) with an in-memory manual override, HTMX filter form, D3 analytics with real tokens, `is-current` accent rail (dead), semantic EJS, print styles, favicon/meta/OG, ~1,180-line styles.css with one theme block per palette.

The visual identity is weak: it's a **wall of 23 identical, fully-expanded cards** with a decorative watermark that crops and overlaps the hero, no footer, no "current role" concept, no timeline structure, and analytics/home pages share the same flat, gray-on-navy idiom. The result reads as a polished admin dashboard, not a modern personal site.

**Direction:** a developer-first editorial ("modern dark terminal") layout — one typographic spine, a career timeline as the signature element, keeping the theme system, HTMX filters, and D3 charts intact.

**Biggest wins, in order:** (1) replace the card wall with a timeline spine, (2) fix the hero (watermark/crop/avatar overlap), (3) add a slim footer + current-role badge, (4) re-grid analytics, (5) retune card density/copy.

---

## 2. What's already good (keep these)

| Area | Evidence |
|---|---|
| Token system | `:root`/data-theme blocks with --bg, --text-1, --accent, --chart-{1..6}, font-display/body — every chart and component consumes tokens (e.g., analytics_dashboard.ejs reads `getComputedStyle` for chart colors). |
| Theme system | Live time-based re-evaluation (05–12 porcelain, 12–17 editorial, otherwise slate-noir), in-memory override, HatMan avatar tint swaps per theme (blue/orange/navy images). Session-scoped, no localStorage persistence. |
| HTMX filter form | Search + skills + companies + employment type + year-range slider + "Clear Filters", all against `/api/filter` (verified: `search=discogs` → 1 card). Works with real keyboard semantics; sidebar sticky. |
| Analytics | `/analytics/distribution` renders 5 real SVG charts (donut, staffing bars, tenure bars, phases); `/analytics/skills` renders 2 charts; `/analytics/timeline` renders career timeline + skills/year. `d3` from jsdelivr CDN. |
| Semantics & safety | `article`, `time`, `fieldset`/`legend`, `aria-label`s, single EJS escape layer (fixed earlier this session — titles/summary items now render `&amp;`/`&#39;` correctly), focus-visible outlines, print stylesheet. |
| Responsive | Breakpoints 900/768/480; sidebar stacks to static column on mobile; cards fill width; no horizontal overflow at 390px (verified). |

---

## 3. Findings

Severity: **P0** = visibly broken/confusing, **P1** = strong design gap, **P2** = polish/consistency, **P3** = optional.

### 3.1 Hero / branding
- **P1 — HatMan watermark is the loudest element on the page.** `position: fixed; top: -3vmin; left: -3vmin; 46vmin; opacity 0.12/0.30` (styles.css:117) — crops at the top edge, sits behind the name/contact block, and in the dark theme reads as an unintended smear + duplicate-ish right-edge band. The bug is not the artwork (keep it) — it's the placement and scale. Fixtured at 1440×900 it occupies the top-left ~40% of the page.
- **P1 — Avatar + text overlap.** `.header-row` flex `align-items: flex-end` with no gap between avatar (56px circle), name (36px, Sora), and role — the avatar sits over the illustration and the name collides with the watermark's visual edge. Needs a clear left column with breathing room; the dark theme flattens the avatar's contrast (both navy).
- **P2 — Divider alignment.** `.resume-header::after` accent underline is at left 0 / width 60px, but the header content is narrower than the full container — the accent bar and border disagree (short accent + full-width border reads as accidental).
- **P2 — Nav and theme pill stack oddly.** `.analytics-nav` (4 pill tabs) sits *above* the theme pill, all inside the header; on mobile both wrap tight. The nav has no scroll context/typography hierarchy — it's a flat row of tabs. Fine for 4 items; weak for a "home" page.
- **P2 — No meta line under the hero.** No one-line positioning statement beyond "Senior Frontend Engineer"; no stats (years, positions, skills count); no link to CV/email. The hero is an identity card, not a thesis.

### 3.2 Skills cloud
- **P2 — Width mismatch.** The skills cloud spans full container width while the sidebar+results area below is two-column (260px+1fr) — the rhythm breaks between sections. Cloud also wraps full-width (ISML alone on last row on mobile). Fix by giving the cloud and the layout the same max-width.
- **P2 — Skill pills are decorative in the hero.** Same pattern as card skill tags (subtle border, lavender text) — visually identical to badges inside cards; no hierarchy distinction between "skills I have" and "skills on this card".

### 3.3 Position cards / timeline
- **P0 — 23 identical, fully-expanded cards.** Home page is **12,085px** tall; every card shows all bullets. The page reads as an appendix, not a résumé. No expand/collapse (non-functional toggle was removed in cccdecf), no timeline structure, no year markers, no "current" treatment.
- **P0 — `.position-card.is-current` is dead code.** `position_card.ejs:1` sets `is-current` only when `dateEnded` is undefined ("Present"). With the current data (all positions ended), no card gets it — the one accent rail that signals "you are here" never fires. Worse, the current role (Discogs, 2022–2026) is not visibly marked anywhere.
- **P1 — Cards don't encode a sequence.** Chronological order is implied only by scroll position; 20+ years with 23 cards and no year rail. A timeline rail with year markers is the natural structural device for this content.
- **P2 — Card density.** BULLETED bullets do carry real content; but each card also repeats meta (duration + badge + skills) as a wall of text. Tighten: one accent line, one badge, one skill row.
- **P2 — No current-year annotation / ongoing marker.** 2026 is the active year in the data — the timeline has nothing to mark it.
- **P3 — Card copy typos** (content-level, not design; copy pass while the timeline is being built): “greately” → greatly; “delovepment” → development; “Zustland” → Zustand; “Virutal” → Virtual; “pipeling” → pipeline; “Provied” → Provided; “proformed” → performed; “Accessability” → Accessibility; “Exprience” → Experience; “Web Site” → Website; “deloping” → developing; “lighning” → lightning.

### 3.4 Filter sidebar
- **P1 — Sidebar is sticky but bloated on mobile.** On ≤900px it stacks below the results; the filter + cards split disappears and filtering requires scrolling back up. No "collapsible filters" pattern on mobile (e.g., "Filters ⏷" accordion).
- **P2 — Filter groups are uniform checkboxes.** 240px max-height per group; lots of scroll. Fine. Worth a collapse toggle on mobile + a "Reset" affordance that's obvious (the "Clear Filters" button is functional but sits at the bottom of a long scroll).
- **P2 — Year slider has 3 labels (From label / range / To)** that crowd — labels read as 3 mini-values; simplify to a range readout.
- **P2 — No active-filter summary.** After filtering, the page shows a new card list with no "showing N of 23" or "filters active: ★" affordance — user can't tell what's applied or how to clear.

### 3.5 Analytics
- **P1 — Grid is full-width.** `repeat(auto-fit, minmax(300px, 1fr))` + 3-col split with wide panels spanning. The page is fine but flat; panels have no visual chrome beyond a faint border and shadow. No section intro; no KPI strip; no “insight” copy. Charts are real and correctly lazy-rendered.
- **P1 — Donut chart has no legend** (employment-type panel: 3 slices, no legend — you can't match slice to label without hovering; center shows only the total count). The staffing bars have category + value labels and firm list, but the donut is still the placeholder for a richer panel.
- **P2 — All panels same width but content density varies** — some 3-col, one 12-bar. A two-column KPI/panel layout + one wide chart is tighter. No “hover” affordances beyond tooltips.
- **P3 — D3 from CDN** (`cdn.jsdelivr.net/npm/d3@7`) means analytics won't render offline. Consider bundling `d3` in `/public/js/` — trivial fix, real payoff.

### 3.6 Mobile
- **P1 — Hero too tall, cramped, no fold structure.** 390×844: name 30px, avatar, role, contact stack on two rows, nav buttons wrap to chips — but no visual hierarchy in the hero; everything competes. The avatar is same-size as body copy; email/phone on one line; watermark clips at top.
- **P2 — Sidebar after cards.** Cards render above filters by default on mobile (good), but the filter is the whole page's navigation on mobile. No "back to filters" jump; no filter count badge.
- **P2 — Mobile typography:** name 1.75rem, cards 1rem; body 0.9; maybe bump title to 1.9rem and let the role line breathe a line below.

### 3.7 Footer / global chrome
- **P2 — No footer.** The `layout.ejs` ends with the nav-highlight script and no footer. For a portfolio, a one-line footer (© + "Built with Node/EJS/HTMX" + city/links) closes the page.
- **P2 — No dynamic nav across pages**. Nav is static; skills/timeline pages show the same header — good enough — but the `current-nav` JS only toggles on pages that load the header. That's the same header included, so it works. Note for the refactor: current-nav breaks on `/position/:id` routes (no JS to highlight "Resume" for the single-position detail page). Check whether the position detail page links nav.

### 3.8 Typography / motion
- **P1 — Hero lacks display presence.** Name is 36px — it's the largest element but the page immediately drops to 15-16px cards; no contrast between display type (Sora, 700, letter-spacing -0.02) and body (Inter). A proper display size (~3.5rem) with a one-line positioning statement would anchor the page.
- **P2 — No load choreography.** Theme is instant (no FOUC, good), but nothing else — no scroll reveal, no chart count-up. Risky to add; a subtle fade-up on hero content is enough. Don't add particle effects.
- **P2 — Cards are static.** No hover raise on the full card; the current 3px accent rail on hover does enough. Keep.

### 3.9 Content issues surfaced by the review
- 23 cards / 12,000px: this is a résumé, not a portfolio — break content down. Card copy has real typos (see 3.3). Birth year/current-year data is present and could power the timeline marker. Stats are not yet stated anywhere on the page.

---

## 4. Recommended modern direction — "The Developer's Timeline"

**Subject:** Jerome Woody — Senior Frontend Engineer; 20+ years, React/mobile, no current role to claim — quietly confident, no branding theater.

**Signature element:** a **career timeline spine** — a left-rail vertical line with year markers (2026 → 2005), each position anchored to its start year, with a "● current" marker for the featured role. Cards become compact, expandable rows, not full-height blocks. The timeline *is* the content — nobody else builds a résumé like a poster.

**Palette & type:** keep the three time-based themes; keep Sora (display) + Inter (body); add mono for years/dates/stats (ui-monospace or "JetBrains Mono" — no webfont needed). Keep the HatMan motif as a faint corner watermark (not overlapping) + small avatar.

**Layout:**
- One max-width spine (1100-1200px), same rhythm on home + analytics.
- Hero block: name, role, one-line positioning, stats row (years, positions, skills, apps shipped if relevant). Theme pill + email/resume link.
- Sidebar (filters) stays, but as **narrow sticky rail** (260px or 280px), not full page width; and on mobile it becomes a collapsible "Filters" accordion above the results.
- Positions render as timeline entries: year marker + title/company/duration + badge + skills + collapsible body. 23 entries are short (3-4 lines each), so the page becomes ~4,500-5,500px of content, scannable and skippable.

**Analytics:** keep the three pages; tighten panels with KPI strip + consistent spacing; keep D3; add a legend and locked aspect ratios; label the staffing bars; bundle d3.

**Footer:** one line — "© 2026 Jerome Woody · Built with Node, EJS, HTMX · Seattle, WA".

**Motion:** fade-up on hero, hover lift on rows, nothing else. Reduced-motion respected (`prefers-reduced-motion: reduce` → disable transitions/animations).

---

## 5. Wireframes

### 5.1 Home — desktop (timeline + sticky filters)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [avatar]  JEROME WOODY                    Resume Analytics Skills Timeline  [🌙] │
│           Senior Frontend Engineer · 20+ yrs · 23 roles · React + mobile          │
│           ──────────────────────────────────                                       │
│           [ email ]  [ resume.pdf ]                                                 │
├─────────────────────────────────────────────────────────┬────────────────────────┤
│                                                         │                        │
│  SKILLS (tag cloud, 30)                                  │  ▼ FILTERS  (~280px)    │
│                                                         │    🔍  Title, company…  │
│  2026 ● Discogs — Sr. Web Developer, UX & Mobile        │    ▢ skills (~35)        │
│        ● Current                                       │    ▢ companies (~19)     │
│        ● January 2022 → October 2026                   │    ▢ type (3)            │
│        [ ▸ expand ]                                     │    Year 2005 ─┬─ 2026     │
│                                                         │    [Clear Filters]      │
│  2020 ─ ● Lululemon — Senior FE Developer/Lead          │                        │
│        ● 2020-08 → 2022-01 · contract                   │  Showing 23 of 23        │
│        ▸ 5 bullets                                     │                        │
│                                                         │                        │
│  2020 ─ ● Amazon — Web Developer III                    │                        │
│        ● 2020-05 → 2020-08 · contract                   │                        │
│        ▸ 6 bullets                                     │                        │
│                                                         │                        │
│  2019 ─ ● Amazon — Web Developer Engineer, Sustain.     │                        │
│  ...                                                    │                        │
│  2005 ─ ● Seattle Weekly — Software Developer            │                        │
│                                                         │                        │
└─────────────────────────────────────────────────────────┴────────────────────────┘
```

### 5.2 Home — mobile (single column, collapsible filters)

```
┌─────────────────────────────────┐
│  [avatar]  Jerome Woody          │
│            Senior FE Engineer    │
│            20+ yrs · 23 roles    │
│  ┌────────────────────────────┐  │
│  │ 🌙 Evening   ✉  resume.pdf  │  │
│  └────────────────────────────┘  │
│  Resume | Analytics | Skills    │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  ┌──────────────────────────┐  │
│  │ ▼ Filters (1 active)      │  │
│  └──────────────────────────┘  │
│  SKILLS cloud (2 rows, wrap)    │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  2026 ● Discogs        [● current]
│        2022-01 → 2026-10 · Full Time
│        ▸ 8 bullets
│  2020 ● Lululemon                │
│  2020 ● Amazon — Web Developer III
│  ...                              │
└─────────────────────────────────┘
```

### 5.3 Analytics — desktop

```
┌─────────────────────────────────────────────────────────────────────┐
│  [avatar]  Jerome Woody    Resume | Analytics Dashboard | Skills | Timeline  [🌙] │
│            Senior FE Engineer · 20+ yrs                                          │
│  ────────────────────────────────────────────                          │
│  KPI  strip:  23 positions · 3 employment types · 2 staffing eras · 20 yrs
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────────┐ │
│  │ Employment Types │ │ Staffing vs      │ │ Company Tenure         │ │
│  │ donut + % legend │ │ Direct Hire      │ │ horizontal bars        │ │
│  │                  │ │ (2 bars + labels)│ │ 12 companies           │ │
│  └──────────────────┘ └──────────────────┘ └────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Most Used Skills — horizontal bars                          │  │
│  │ Each chart: title · subtitle · padded · consistent gaps     │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Career Phases — summary tiles (3-4 phase chips)            │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Skills page (kept same layout, tighter chart chrome)
```
  ┌──────────────┬──────────────┐
  │ Skill Freq    │ Career Phases│
  │ horizontal bars│  (kept)     │
  └──────────────┴──────────────┘
```

### 5.5 Footer (all pages)

```
┌─────────────────────────────────────────────────────────────────────┐
│  © 2026 Jerome Woody · Built with Node, EJS & HTMX · d3       │
│  Seattle, WA · Privacy / Contact                                  │
└────────────────────────────────────────────────────────────────────┘
```

---

## 6. Wireframe review decisions for you

1. **Direction:** dark-first with the three time-based themes preserved (Porcelain/Editorial/Slate Noir). Recommend keeping the HatMan motif — repositioned, not deleted.
2. **Timeline spine** — do you want this to replace the cards, or sit alongside them (cards as expandable rows on the timeline)?
3. **Hero stats:** what do you want exposed? Years (20+), positions (23), skills (30), or current badge (Discogs, 2022 → 2026)?
4. **Footer:** what do you want in it?
5. **Font:** keep Sora + Inter + mono for years/stats, or want a different display face?

---

## 7. Rough build plan (one priority level at a time)

**P0 — visual + structural:** timeline spine + expandable rows, hero redesign, sidebar consolidation (sticky rail / mobile accordion), footer. Validate: `node validate-xml.js`, screenshots at 1440 / 1024 / 768 / 390.

**P1 — polish:** card copy pass (typos from 3.3), nav → active-state audit across `/position/:id`, analytics legend + staffing labels, KPI strip, current-role badge via data (first card with `date_ended` empty OR the latest card by end-year), mobile hero restructure, `is-current` dead-code fix (make the current role visibly marked).

**P2 — long-term:** bundle d3 (offline support), load-in-animation on hero + charts, accessibility audit (focus order, aria labels on collapse buttons, prefers-reduced-motion), print/CRI styles refresh.

**P3 — optional:** richer skill-cloud hierarchy (primary technologies vs tools), "show N of 23" filter summary, sitemap.xml, OG image.

---

## 8. Wireframe thumbnails

All ASCII above (W1–W5). To render them in a review
environment, can point `npx --yes voila` or `md` through your
preferred markdown renderer; the same content is valid markdown
code blocks — paste into Cool / Cursor / anything that renders
markdown.
