# React → HTMX Conversion Plan: Interactive Resume Site

## Executive Summary

Convert the React SPA frontend to an HTMX-driven interactive dashboard with server-rendered HTML, client-side fragment swaps, and dynamic filtering. The backend shifts from JSON-only API to a dual-mode API serving both HTML fragments and JSON (backward compatible).

---

## 1. Data Inventory

### Entities (from XML schema + data)

**Positions: 17** (Feb 2005 – Present)

**Companies: 17**
Amazon, Discogs, Rational Interaction, River Logic, Expedia, Epicenter Networks,
Zumiez, Quorum Review, ASAALH, Medio, OCLC, Zaaz, Seattle Times, All Stars Directory,
Grist Magazine, Seattle University, Seattle Weekly

**Staffing Firms: 8**
LG Consulting, AIM Consulting, Rylem, Creative Circle, Greythorn, Parker Staffing,
Redmond Technology Partners, Aditi Staffing

**Skills: 43**
php, codeigniter, pear, simpletest, perl, xml, xpath, xpointer, xquery, html, html5,
xhtml, xslt, css, less, javascript, jquery, nodejs, typescript, sql, mysql, postgresql,
java, java_servlets, jsp, freemarker, asp, cold_fusion, sas, ccplus, csharp, tcl, ruby,
r, python, groovy, react, ...

**Employment Types: 3**
full_time, contract, freelance

**Specialization Groups: 7**
Education, Specialties, E-Commerce Systems, Content Management Systems,
Android/Mobile Web Dev, Social Networks/Cloud Dev, Systems Analysis, Library Science

**Year Range: 2005–2022** (active positions extend to present)

### JSON Model Structure (output of `model.js build()`)

```typescript
{
  contact_info: { name: string, phone: string, email: string },
  skills:        { skill_id: string, skill_value: string }[],
  specialization_groups: { label: string, specializations: string[] }[],
  companies:     { company_id: string, company_name: string, company_location: string }[],
  positions: [
    {
      $: {
        position_id: string,       // e.g. "dis2022"
        company_fk: string,        // e.g. "amazon"
        staffing_fk?: string,      // optional
        skills_fk: string,         // space-separated IDs: "html react css"
      },
      position_title: { _: string, $: { position_type: 'full_time'|'contract'|'freelance' } },
      date_started: { $: { month: string, year: string } }[],
      date_ended?: { $: { month: string, year: string } }[],
      position_summary?: { summary_item: any }[],
      summary_items: string[],     // normalized by model.js
    }
  ],
}
```

---

## 2. Target Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser                              │
│                                                         │
│  index.html (server-rendered)                          │
│  ├─ Header + Contact Info (static)                      │
│  ├─ Filter Sidebar (HTMX-driven)                        │
│  │  ├─ Skills checkboxes (hx-get, hx-trigger)          │
│  │  ├─ Company select (hx-get, hx-trigger)             │
│  │  ├─ Employment type checkboxes                       │
│  │  ├─ Year range slider/inputs (hx-get, hx-trigger)   │
│  │  └─ Clear filters button                             │
│  ├─ Results Area (HTMX swap target)                     │
│  │  ├─ Position cards (server-rendered HTML fragments) │
│  │  └─ "Show more" drill-down (hx-get on card header)  │
│  └─ Active filter badges (hx-boosted links)            │
│                                                         │
│  HTMX intercepts all filter changes →                    │
│  POSTs filter state to /api/filter →                    │
│  receives HTML fragment →                               │
│  swaps into results area                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              Express Server (controller.js)             │
│                                                         │
│  GET  /                        → full page (HTML)       │
│  GET  /api/positions           → JSON | HTML fragment   │
│  GET  /api/filter              → JSON | HTML fragment   │
│  GET  /api/position/:id        → JSON | position detail │
│  GET  /api/positions/by-skill/:id → JSON | HTML         │
│  GET  /api/positions/by-company/:id → JSON | HTML       │
│  GET  /api/positions/by-year/:year  → JSON | HTML       │
│                                                         │
│  Template Engine: EJS (views/)                          │
│  ├─ views/layout.ejs        → page shell               │
│  ├─ views/position_card.ejs → single position card     │
│  ├─ views/position_list.ejs → container with cards     │
│  └─ views/filters.ejs       → sidebar filter UI        │
└─────────────────────────────────────────────────────────┘
```

---

## 3. HTMX Patterns for Each Feature

### 3.1 Filter Sidebar → Results Swap

```html
<!-- Filter sidebar -->
<form id="filter-form" hx-post="/api/filter"
      hx-target="#results"
      hx-trigger="change delay:200ms from:form"
      hx-swap="outerHTML"
      hx-indicator=".loading-spinner">

  <!-- Skills checkboxes -->
  <fieldset>
    <legend>Skills</legend>
    <label><input type="checkbox" name="skill" value="python"> Python</label>
    <label><input type="checkbox" name="skill" value="react"> React</label>
    <!-- ... all 43 skills ... -->
  </fieldset>

  <!-- Company multi-select -->
  <fieldset>
    <legend>Company</legend>
    <select name="company" multiple>
      <option value="amazon">Amazon</option>
      <option value="expedia">Expedia</option>
      <!-- ... all companies ... -->
    </select>
  </fieldset>

  <!-- Employment type -->
  <fieldset>
    <legend>Employment Type</legend>
    <label><input type="checkbox" name="type" value="full_time"> Full Time</label>
    <label><input type="checkbox" name="type" value="contract"> Contract</label>
    <label><input type="checkbox" name="type" value="freelance"> Freelance</label>
  </fieldset>

  <!-- Year range -->
  <fieldset>
    <legend>Years</legend>
    <input type="number" name="year_from" value="2005" min="2005" max="2026">
    <span>–</span>
    <input type="number" name="year_to" value="2026" min="2005" max="2026">
  </fieldset>
</form>

<!-- Results area (swap target) -->
<div id="results" class="positions-container">
  <!-- Server-rendered position cards appear here -->
</div>
```

**How it works:** Any filter change fires `hx-trigger` after 200ms delay (debounce). Form encodes all filters → POST to `/api/filter` → server renders matching positions as HTML fragment → swaps into `#results`. URL updates automatically via `hx-headers` or `hx-push-url="true"`.

### 3.2 Position Drill-Down (Expand/Collapse Details)

```html
<article class="position-card">
  <!-- Always visible summary -->
  <header class="position-header">
    <h3 class="position-title">Sr. Web Developer, UX</h3>
    <!-- ... -->
  </header>

  <!-- Expanded details loaded on-demand -->
  <details class="position-details"
           hx-get="/api/position/dis2022/details"
           hx-trigger="reveal from:details"
           hx-swap="innerHTML"
           hx-target=".position-body">
    <summary>View Details</summary>
    <div class="position-body">
      <div class="htmx-indicator">Loading...</div>
    </div>
  </details>
</article>
```

### 3.3 Active Filter Badges (clickable removal)

```html
<div class="active-filters">
  <span class="filter-badge">
    React
    <button hx-delete="/api/filter"
            hx-vals='{"remove_skill": "react"}'
            hx-target="#results"
            hx-swap="outerHTML"
            hx-push-url="true"
            ×</button>
  </span>
</div>
```

### 3.4 Loading States

```css
/* Hide loading indicator when HTMX request is idle */
.htmx-indicator { display: none; }
.htmx-request .htmx-indicator { display: inline; }
.htmx-request.htmx-indicator { display: inline; }
```

### 3.5 Compound Filter Encoding

All filters sent as a single POST body:
```
skill=python&skill=react&company=amazon&type=contract&year_from=2015&year_to=2020
```

Server-side filter logic in `controller.js`:
```javascript
app.post('/api/filter', (req, res) => {
  const filters = req.body;
  const matching = filterPositions(resume_data, filters);
  // Accept: text/html → render HTML fragment
  // Accept: application/json → return JSON (backward compat)
});
```

---

## 4. Backend Changes (`rs_back/controller.js`)

### 4.1 New Dependencies
```json
{
  "dependencies": {
    "ejs": "^3.1.10"
  }
}
```

### 4.2 Filter Logic (new endpoint)

```javascript
// Unified filter endpoint
app.post('/api/filter', (req, res) => {
  const { skill, company, type, year_from, year_to } = req.body;
  let positions = resume_data.positions;

  // Filter by skill
  if (skill && skill.length) {
    positions = positions.filter(p =>
      skill.some(s => p.position.$.skills_fk.includes(s))
    );
  }

  // Filter by company
  if (company && company.length) {
    positions = positions.filter(p =>
      company.includes(p.position.$.company_fk)
    );
  }

  // Filter by employment type
  if (type && type.length) {
    positions = positions.filter(p =>
      type.includes(p.position.position_title[0].$.position_type)
    );
  }

  // Filter by year range
  if (year_from || year_to) {
    const from = parseInt(year_from) || 0;
    const to = parseInt(year_to) || 9999;
    positions = positions.filter(p => {
      const year = parseInt(p.position.date_started[0].$.year);
      return year >= from && year <= to;
    });
  }

  // Sort by date (newest first)
  positions.sort((a, b) => {
    const aY = parseInt(a.position.date_started[0].$.year);
    const bY = parseInt(b.position.date_started[0].$.year);
    return bY - aY;
  });

  // Dual-mode response
  if (req.headers.accept?.includes('text/html')) {
    res.render('position_list', { positions, skill_map: resume_data.skills, company_map: resume_data.companies });
  } else {
    res.json(positions);
  }
});
```

### 4.3 Content Negotiation Helper

```javascript
// Middleware to set template engine and handle Accept headers
const path = require('path');
const ejs = require('ejs');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
```

### 4.4 Existing Endpoints — Add HTML Mode

Each existing endpoint (`/`, `/position/:id`, `/skill/:id`, etc.) gets a content-type check:
```javascript
if (req.accepts('html')) {
  res.render(template, { data });
} else {
  res.json(data);
}
```

---

## 5. Template Structure

### 5.1 Directory Layout

```
rs_back/
  views/
    layout.ejs          # Page shell (HTML, head, body wrapper)
    header.ejs          # Name + contact info
    position_card.ejs   # Single position card (included by list)
    position_list.ejs   # Container with position cards
    filters.ejs         # Filter sidebar (included on main page)
    position_detail.ejs # Expanded position details (AJAX target)
```

### 5.2 EJS Template: position_card.ejs

```ejs
<article class="position-card">
  <div class="position-content">
    <header class="position-header">
      <h3 class="position-title"><%= escapeHtml(posTitle) %></h3>
      <div class="position-company">
        <span class="company-name"><%= escapeHtml(companyName) %></span>
        <% if (staffingFk) { %>
          <span class="staffing-separator">via</span>
          <span class="staffing-name"><%= escapeHtml(staffingFk) %></span>
        <% } %>
      </div>
    </header>

    <div class="employment-details">
      <div class="duration">
        <span class="duration-label">Duration: </span>
        <span class="date-range">
          <time class="date-start"><%= formatDate(dateStarted) %></time>
          <span class="date-separator"> – </span>
          <time class="date-end"><%= dateEnded ? formatDate(dateEnded) : 'Present' %></time>
        </span>
      </div>
      <div class="employment-type">
        <span class="type-label">Employment Type: </span>
        <span class="type-value"><%= formatType(positionType) %></span>
      </div>
    </div>

    <% if (skills && skills.length > 0) { %>
    <div class="skills-section">
      <h4 class="skills-title">Technologies &amp; Skills</h4>
      <div class="skills-list">
        <% skills.forEach(s => { %>
          <span class="skill-tag" hx-get="/api/positions/by-skill/<%= s %>" hx-target="#results" hx-swap="outerHTML" style="cursor:pointer"><%= s %></span>
        <% }) %>
      </div>
    </div>
    <% } %>

    <% if (summaryItems && summaryItems.length > 0) { %>
    <div class="summary-section">
      <h4 class="summary-title">Key Responsibilities &amp; Achievements</h4>
      <ul class="summary-list">
        <% summaryItems.forEach(item => { %>
          <li class="summary-item"><%= escapeHtml(item) %></li>
        <% }) %>
      </ul>
    </div>
    <% } %>
  </div>
</article>
```

### 5.3 layout.ejs

```ejs
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><%= title %></title>
  <link rel="stylesheet" href="/css/styles.css">
  <script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.4"></script>
</head>
<body>
  <div class="resume-container">
    <%= body %>
  </div>
</body>
</html>
```

---

## 6. Frontend Changes (`rs_front/`)

### 6.1 What to Delete

| File/Directory | Reason |
|---|---|
| `package.json`, `package-lock.json` | No npm deps needed |
| `webpack.config.js` | No bundler |
| `babel.config.js` | No transpilation |
| `src/index.js` | No React entry point |
| `src/index.html` | Replaced by server-rendered templates |
| `src/index.css` | Superseded by styles.css |
| `src/components/App.js` | Replaced by HTMX + EJS |
| `src/components/PositionCard.js` | Replaced by position_card.ejs |
| `src/logo.svg` | Unused |

### 6.2 What to Keep

| File | Action |
|---|---|
| `src/styles.css` | Move to `rs_front/css/styles.css` (keep unchanged) |
| `AGENTS.md` | Update with new build instructions |

### 6.3 New Structure

```
rs_front/
  css/
    styles.css           # unchanged from src/styles.css
  index.html             # fallback page (server unavailable)
  AGENTS.md              # updated build docs
```

### 6.4 Fallback index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CV of Jerome Woody</title>
  <style>body{font-family:sans-serif;padding:2rem;text-align:center}</style>
</head>
<body>
  <h1>CV of Jerome Woody</h1>
  <p>The resume server is currently unavailable.</p>
</body>
</html>
```

---

## 7. Implementation Phases

### Phase 1: Backend Foundation (controller + templates)
1. Add `ejs` to `rs_back/package.json`
2. Create `rs_back/views/` directory
3. Write `views/layout.ejs`, `views/header.ejs`, `views/position_card.ejs`
4. Add `req.accepts('html')` branches to existing endpoints
5. Add `/api/filter` POST endpoint with compound filtering
6. Add `app.use(express.urlencoded({ extended: true }))` for form parsing
7. Add helper functions: `formatDate()`, `formatType()`, `getSkillNames()`, `getCompanyName()`
8. Test: `node controller.js` → `curl -H "Accept: text/html" http://localhost:3001`

### Phase 2: Static Page Rendering
1. Complete `views/header.ejs` (contact info section)
2. Complete `views/position_list.ejs` (renders all positions)
3. Update `GET /` to render full page via EJS
4. Serve static CSS: `app.use('/css', express.static(path.join(__dirname, '../rs_front/css')))`
5. Test: open `http://localhost:3001` in browser, verify full page renders correctly

### Phase 3: HTMX Filter Integration
1. Write `views/filters.ejs` (filter sidebar with HTMX attributes)
2. Wire up filter form → `/api/filter` POST
3. Add active filter badges with removable chips
4. Add `hx-push-url="true"` for shareable filter URLs
5. Add loading indicators with `.htmx-indicator` CSS
6. Test: toggle filters, verify results update without page reload

### Phase 4: Interactive Features
1. **Clickable skill tags**: Click a skill tag → filter by that skill (HTMX `hx-get` on the tag)
2. **Position detail expansion**: Click position header → load full details via `hx-get`
3. **Year range slider**: Add a visual range selector
4. **Search**: Add a text search input filtering by title/company/skills

### Phase 5: Cleanup & Polish
1. Delete all React/Webpack/Babel files from `rs_front/`
2. Move `styles.css` to proper location
3. Update `rs_front/AGENTS.md` with new instructions
4. Update `README.md` at project root
5. Add HTMX-specific CSS transitions for smoother swaps
6. Remove `console.log(item)` debug leftover from PositionCard.js

---

## 8. Feature Matrix: Before → After

| Feature | React SPA | HTMX Dashboard |
|---|---|---|
| Full resume display | ✅ | ✅ (server-rendered) |
| Skills filtering | ❌ | ✅ (checkboxes → swap) |
| Company filtering | ❌ | ✅ (select → swap) |
| Employment type filter | ❌ | ✅ (checkboxes → swap) |
| Year range filter | ❌ | ✅ (number inputs → swap) |
| Click-to-filter (skill tags) | ❌ | ✅ (hx-get on tags) |
| Position drill-down | ❌ | ✅ (details reveal → hx-get) |
| Shareable filter URLs | ❌ | ✅ (hx-push-url) |
| Loading indicators | ✅ (React state) | ✅ (htmx-indicator) |
| Error states | ✅ (React state) | ✅ (server returns error HTML) |
| Build step | Webpack + Babel | None |
| JS bundle size | ~140 KB | ~14 KB (HTMX CDN) |
| Client-side dependencies | React 18 | HTMX 2.0 |

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| EJS template escaping issues with special chars in XML data | Medium | High | Use `escapeHtml()` helper; test with data containing `<`, `>`, `&`, `'` |
| Filter form encoding edge cases (multiple checkboxes) | Low | Low | Express `body-parser` handles arrays natively |
| HTMX swap flicker on slow connections | Low | Low | Add `.htmx-indicator` spinner; CSS `transition` on swap target |
| Existing JSON API consumers break | Low | Medium | Content negotiation preserves JSON responses for existing clients |
| Date formatting inconsistency (React vs EJS) | Medium | Low | Centralize formatting in backend helper functions |

---

## 10. Build Commands (After Conversion)

```bash
# Start backend (serves everything)
cd rs_back
npm install
node controller.js

# Development (with nodemon for hot reload)
npx nodemon controller.js

# No frontend build step — CSS is served as static files
# No React, no Webpack, no Babel
```

---

## 11. Success Criteria

1. [ ] Full resume renders correctly via `GET /` (server-rendered HTML)
2. [ ] All 17 positions display with correct data (title, company, dates, skills, summaries)
3. [ ] Skill filtering narrows results correctly (checkbox selection → instant swap)
4. [ ] Company filtering works independently and in combination with skills
5. [ ] Employment type filtering works
6. [ ] Year range filtering works (start year, end year, both)
7. [ ] Compound filters work (skill + company + type + year simultaneously)
8. [ ] Filter changes are debounced (no request per keystroke)
9. [ ] Loading indicators appear during filter swaps
10. [ ] URL reflects current filter state (shareable/bookmarkable)
11. [ ] Existing JSON API endpoints still work (`Accept: application/json`)
12. [ ] No JavaScript errors in browser console
13. [ ] Responsive CSS works at 320px, 768px, and 1200px widths
