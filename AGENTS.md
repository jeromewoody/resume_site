# Resume Site — Agent Instructions

## Quick start

```bash
cd src && npm install && node controller.js   # server on :3001
```

## Architecture

- **Entry:** `src/controller.js` — Express server (port 3001). Serves both HTML (HTMX) and JSON responses.
- **Data layer:** `src/data/model.js` — single async `build(filePath)` that parses the XML via `xmldom` + `xpath` for structure, then `xml2js` per-position to flatten into JS objects. Exports `{ build }`.
- **Analytics:** `src/data/analytics.js` — pure functions over the built model (skill frequency, tenure, phases, etc.). Imported by controller; not a separate server tier.
- **Views:** `src/views/*.ejs` — EJS templates rendered server-side via `res.render`. The page shell (`layout.ejs`) wraps an inner view passed as `body`, so full pages re-render the layout while HTMX swaps swap only fragments (e.g. `position_list`, `position_card`).
- **Static:** `src/public/css/styles.css` served at `/css/`.

Data flow: XML → `model.build()` (called once in an async IIFE at startup) → in-memory `resume_data` + lookup maps (`skillMapById`, `companyMapById`, `staffingMapById`) populated by `buildLookupMaps()`. No database, no migrations. Changes to the XML require a server restart; changing `staffingDefaults` requires a restart too (it's built into the map step).

## Key files & conventions

- **`src/controller.js`** — all routes + helpers (`escapeHtml`, `formatDate`, `formatType`, date math via `year*100+month`). Route handlers repeat attribute-extraction boilerplate because xml2js leaves single attributes on `$.`; watch for the `Array.isArray` normalization pattern when touching position fields.
- **`src/data/model.js`** — parser only; **never** edit resume content here. Returns `{ contact_info, skills, specialization_groups, companies, positions }` where each `<position>` is flattened and has a `summary_items: string[]` array (the nested `position_summary` is deleted).
- **`src/data/jerome_woody_resume.xml`** — single source of truth for resume content. Edit this when changing job titles, dates, skills, companies, or staffing firms; restart the server afterward. `resume.dtd` and `resume.xsd` are reference schemas (DTD is what validation actually uses).
- **`src/views/position_card[_detail].ejs`** — swapped via HTMX for card expand/collapse on `/api/position/:id/card|summary`.

## Environment & tooling

- **Node 18+**, CommonJS (`require`). No build step, no TypeScript.
- `package.json` is at **`src/package.json`** (not the repo root) — run npm scripts from inside `src/`.
- Scripts: none for lint/typecheck/format/test-fake).

## Commands

```bash
cd src && node validate-xml.js   # xmlllint --noout --valid on the XML (xmllint must be installed)
curl http://localhost:3001/api/position/POSITION_ID/card   # HTMX fragment check
npx prettier -w controller.js model.js data/analytics.js  # optional formatting only; not configured in repo
```

## Routes

Full-page or HTML-fragment (driven by `wantsHtml()`: true when header `hx-request` is present, or `Accept: text/html` without JSON):

| Route | Description |
|-------|-------------|
| `GET /` | Full resume page (`layout.ejs`) — sorted newest-first. Without HTML accept → raw JSON dump of the model. |
| `GET /position/:id` | Single position detail page or JSON object (`{}` if not found). |
| `GET /skill/:id`, `/company/:id`, `/staffing/:id` | Positions matching a skill/company/staffing `fk`. HTML fragments return `[]`-like empty to EJS; JSON returns `[]` when nothing matches. Note: these match **exact fk token in space-delimited string** for skills, so `sk_js` will not falsely match `sk_nodejs` — but `/skill/:id` splits on whitespace and checks membership rather than substring (`includes()`), unlike the older `/api/positions/by-skill/` variant which used `.includes(skillId)` (substring). Prefer the non-`/api` variants for correctness. |
| `GET /dates/:start/:end` | `:start`/`:end` are `YYYY-M` or `YYYY-MM`. Positions whose start **or** end date overlaps the range; open-ended (`date_ended`) treated as current month. Sorted newest-first. Returns `[]` empty page/fragment when out of range — renders blank, not error. |

JSON + HTMX API:

| Route | Description |
|-------|-------------|
| `GET /api/positions/by-skill/:id` | Uses `.includes(skillId)` substring match (broader/less safe than `/skill`). |
| `GET /api/positions/by-company/:id`, `/by-year/:year` | Exact company fk or start year. |
| `POST /api/filter` | Compound filter body: `skill[]`(may repeat), `company[]`,`type[]('full_time'|'contract'|'freelance')','search'(title/company/skill-case-insensitive),'year_from'/'year_to'`. Accepts both repeated form fields (arrays) and single values. Returns HTML fragment or JSON, same sort order. |
| `GET /api/position/:id/card` — Expanded card detail (`position_card_detail.ejs`) for HTMX expand click. ID must exist (returns empty string if not found). |
| `GET /api/position/:id/summary` — Collapsed summary card (`position_card.ejs`). Same note. |

Analytics (JSON or HTML via layout):

| Route | Description |
|-------|-------------|
| `GET /analytics` | All metrics in one JSON object (skill_frequency, skill_cooccurrence≥2, skills_over_time 5-yr buckets, employment_types w/%, career_timeline, company_Tenure, staffing direct vs by_firm, career_phases). |
| `/analytics/distribution` | The full analytics dashboard (HTML or JSON): Employment Types, Staffing vs Direct Hire, Company Tenure, Skill Frequency, Career Phases, and the Skills-Over-Time heatmap. The separate `/analytics/skills` and `/analytics/timeline` pages were removed (redundant with the homepage timeline; their charts live here now). Backend is read-only; no analytics DB writes. No frontend framework bundled — D3 is referenced from a CDN in the views; offline runs cannot render charts.|

## Gotchas for agents

- `wantsHtml()` is how every route decides fragment-vs-JSON; if you add a route, branch on it rather than content-negotiation libraries (none installed).
- Date fields are objects with `$` attributes: `{ $: { year: '2021', month: '6' } }` when parsed via xpath/xml2js. Use `formatDate()`/the `year*100+month` idiom consistently; do not assume flat `{year,month}`.
- Staffing firms come from the hardcoded `staffingDefaults` map at `controller.js:~124`; new IDs fall back to snake-case→Title-Case conversion. Changing display names means editing that object and restarting — NOT a data-only edit.
- `/api/positions/by-skill/:id` uses **substring** `.includes()` and can return false positives; prefer `/skill/:id` for token-exact matching when correctness matters.
- `npm test` always exits 1 (no tests); do not treat it as a failure indicator or add a real suite without asking.