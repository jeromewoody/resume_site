# Resume Site — Agent Instructions

## Quick start

```bash
cd src && npm install && node controller.js   # server on :3001
```

## Architecture

- **Entry:** `src/controller.js` — Express server (port 3001). Serves both HTML (HTMX) and JSON responses.
- **Data layer:** `src/data/model.js` — single `build()` function that parses `src/data/jerome_woody_resume.xml` via `xml2js` + `xmldom` + `xpath`.
- **Views:** `src/views/*.ejs` — EJS templates rendered server-side.
- **Static:** `src/public/css/styles.css`.

Data flows: XML → `model.build()` → `controller.js` routes. No database, no migrations.

## Key files

| File | Purpose |
|------|---------|
| `src/controller.js` | All routes, helpers, lookup maps |
| `src/data/model.js` | XML parser, exports `{ build }` |
| `src/data/jerome_woody_resume.xml` | Source of truth (resume data) |
| `src/data/resume.dtd` | DTD schema for XML validation |
| `src/validate-xml.js` | Runs `xmllint --noout --valid` on the XML |
| `src/views/layout.ejs` | Root template wrapper |
| `src/public/css/styles.css` | All styling |

## Constraints

- **No test framework.** `src/package.json` has `npm test` that always exits 1.
- **No lint / formatter / typecheck.** None configured.
- **No build step.** Run `node controller.js` directly.
- **No env files needed.** Server works without `.env`.
- **XML is the single source of truth.** All resume data lives in `jerome_woody_resume.xml`. When editing resume content, edit the XML file, not the JS.
- **HTMX drives interactivity.** Routes return HTML fragments for HTMX swaps and JSON for direct API consumers (check `wantsHtml()`).
- **Staffing map is hardcoded.** `staffingDefaults` in `controller.js:125` maps staffing IDs to display names. Updating this requires a server restart.
- **Data is loaded once at startup.** Changes to the XML file require a server restart to take effect.

## Routes

- `GET /` — Full resume (HTML or JSON)
- `GET /position/:id` — Single position
- `GET /skill/:id` — Positions by skill
- `GET /company/:id` — Positions by company
- `GET /staffing/:id` — Positions by staffing firm
- `GET /dates/:start/:end` — Positions in date range
- `POST /api/filter` — Compound filter (skill, company, type, search, year range)
- `GET /api/position/:id/card` — Expanded card (HTMX)
- `GET /api/position/:id/summary` — Collapsed card (HTMX)

## Validation

```bash
cd src && npm run validate-xml   # requires xmllint on PATH
```
