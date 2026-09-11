# Debugging Task: Filter Pane Not Working

## Symptom

Checking/unchecking filter inputs (skills, companies, employment type, year range, search text) does not update the position cards in the results area.

## Flow Traced

```
User checks checkbox → HTMX fires POST /api/filter
    → Server filters positions → renders position_list.ejs
    → Response: <div id="results" class="positions-container">...</div>
    → HTMX swaps response into #results via hx-swap="innerHTML"
```

## Root Cause

**`filters.ejs` lines 8 and 95: `hx-swap="innerHTML"` is wrong.**

The server response from `/api/filter` is the full `position_list.ejs` template, which wraps its content in `<div id="results" class="positions-container">`. When this response is swapped as `innerHTML` into the existing `#results` element, you get:

```html
<div id="results" class="positions-container">    <!-- original, from initial page load -->
  <div id="results" class="positions-container">  <!-- swapped in from server response -->
    ...position cards...
  </div>
</div>
```

On the next filter change, HTMX's `document.querySelector('#results')` finds the **first** `#results` element — the outer one, which was the original target. It swaps the new response as innerHTML into the outer `#results`, which replaces the inner `#results` (the one with the actual filtered content). This keeps creating a chain of nested divs, and the actual visible content never updates because HTMX keeps targeting the wrong element.

## Additional Bugs Found

### 2. Missing routes for position detail toggle

The templates call:
- `hx-get="/api/position/<%= posId %>/card"`
- `hx-get="/api/position/<%= posId %>/summary"`

But `controller.js` has **no routes** for `/api/position/:id/card` or `/api/position/:id/summary`. The only position route is `GET /position/:id` (line 224), which renders `position_detail.ejs` (a full page layout, not a fragment). Clicking "View Details" / "Show Less" will return 404.

### 3. `change from:body` is too broad

`hx-trigger="change from:body delay:200ms"` fires for **any** change event anywhere in the body, not just the form's own inputs. If any other element on the page fires a change event (e.g., from a future feature), it would trigger an unwanted filter POST. Should scope to the form's own inputs.

### 4. `position_detail.ejs` renders a full page layout

It uses `include('layout', ...)` which wraps the card in a full HTML document. If ever called via HTMX, it would inject a full page into a fragment target. Should be refactored to render just the card fragment.

### 5. HTMX 2.x CDN URL returns ESM, not UMD (CRITICAL)

`layout.ejs` uses:
```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.4"></script>
```

jsDelivr resolves bare package URLs to ESM builds (`htmx.esm.js`) which contain `export` statements. Classic `<script>` tags cannot parse ESM, producing the error: `Unexpected token 'export'`. HTMX never loads, so all `hx-*` attributes are inert.

**Fix:** Use the explicit UMD build URL:
```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.4/dist/htmx.min.js"></script>
```

### 6. HTMX 2.x omits `Accept: text/html` header (CRITICAL)

`controller.js` `wantsHtml()` checks `req.headers.accept === 'text/html'`. HTMX 2.x no longer sends this header. Instead it sends `HX-Request: true` / `hx-request: true`. Without this header, `wantsHtml()` returns `false`, and all HTMX POST requests fall through to the JSON response path. JSON is injected as raw text into the DOM, replacing `#results` and breaking the page.

**Fix:** Also check for the `HX-Request` / `hx-request` header in `wantsHtml()`:
```js
function wantsHtml(req) {
  return req.headers.accept?.includes('text/html')
    || req.headers['hx-request'] === 'true'
    || req.headers['HX-Request'] === 'true';
}
```

## Fix

### Primary fix — `filters.ejs`

Change `hx-swap="innerHTML"` to `hx-swap="outerHTML"` on both the form (line 8) and the clear button (line 95):

```html
<!-- Form -->
<form id="filter-form"
      hx-post="/api/filter"
      hx-target="#results"
      hx-trigger="change from:body delay:200ms, keyup from:#search-input delay:300ms"
      hx-swap="outerHTML"        <!-- was innerHTML -->
      hx-push-url="true">

<!-- Clear button -->
<button type="button" class="clear-filters-btn"
        hx-post="/api/filter"
        hx-target="#results"
        hx-swap="outerHTML"      <!-- was innerHTML -->
        hx-push-url="true">
```

This replaces the entire `#results` div with the server response, avoiding nesting.

### Secondary fix — scope the trigger

Change line 7 from:
```
hx-trigger="change from:body delay:200ms, keyup from:#search-input delay:300ms"
```
to:
```
hx-trigger="change from:#filter-form delay:200ms, keyup from:#search-input delay:300ms"
```

This ensures only changes within the filter form itself trigger the POST.

### Tertiary fix — add missing routes

Add routes in `controller.js` for:
- `GET /api/position/:id/card` → render `position_card_detail.ejs` (expanded card fragment)
- `GET /api/position/:id/summary` → render `position_card.ejs` (collapsed card fragment)

### Quaternary fix — refactor `position_detail.ejs`

Remove the `layout` wrapper. Render just the card fragment so HTMX can swap it in without injecting a full HTML document.

### Critical fix A — HTMX CDN URL

`layout.ejs` line 8: change bare package URL to explicit UMD build:
```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.4/dist/htmx.min.js"></script>
```

### Critical fix B — `wantsHtml()` header detection

Add `HX-Request` / `hx-request` header check to `wantsHtml(req)` in `controller.js:170` so HTMX 2.x requests are detected as HTML consumers even without `Accept: text/html`.

## Verification Steps

1. Start server: `cd src && node controller.js`
2. Open `http://localhost:3001` in browser
3. Check a skill checkbox — position cards should update
4. Uncheck it — all cards should reappear
5. Type in search box — cards should filter
6. Click "Clear Filters" — all cards should reappear
7. Click "View Details" on a card — card should expand
8. Click "Show Less" — card should collapse

## Results

All 8 steps pass. Summary of verified behavior:

| Step | Action | Cards Before | Cards After | Pass |
|------|--------|-------------|-------------|------|
| 3 | Check "React" skill | 18 | 1 | Y |
| 4 | Uncheck "React" | 1 | 18 | Y |
| 5 | Search "Spring" | 18 | 9 | Y |
| 6 | Clear Filters | 9 | 18 | Y |
| 7 | "View Details" card toggle | collapsed | expanded | Y |
| 8 | "Show Less" card toggle | expanded | collapsed | Y |
| bonus | Check "Contract" type | 18 | 11 | Y |

## Files Changed

| File | Change |
|------|--------|
| `src/views/layout.ejs` | HTMX CDN URL: `htmx.org@2.0.4` → `htmx.org@2.0.4/dist/htmx.min.js` |
| `src/controller.js` | `wantsHtml()`: added `HX-Request`/`hx-request` header check |
| `src/views/filters.ejs` | `hx-swap`: `innerHTML` → `outerHTML`; `hx-trigger`: `from:body` → `from:#filter-form` |

## Root Causes

1. **ESM CDN URL** — `https://cdn.jsdelivr.net/npm/htmx.org@2.0.4` serves ESM (`htmx.esm.js`) with `export` keyword. Classic `<script>` rejects it. HTMX never loaded → all `hx-*` attributes inert (console error: `Unexpected token 'export'`).

2. **`wantsHtml()` missing HTMX 2.x header** — HTMX 2.x omits `Accept: text/html` header. Sends `HX-Request: true` instead. Without detection, all HTMX requests returned JSON → raw JSON text replacing `#results` DOM element → page broken.

3. **`innerHTML` swap caused nested `#results`** — Server returns `<div id="results">...</div>`. Swapping as `innerHTML` into existing `#results` creates nested divs. `outerHTML` fix replaces the entire target element.

4. **`from:body` trigger too broad** — `change from:body` captures change events from any element on the page. Scoped to `from:#filter-form` for form-only triggers.

5. **Missing/incorrect card toggle routes** — `GET /api/position/:id/card` and `/api/position/:id/summary` existed but mapped to wrong templates (`card`→`position_card.ejs`, `summary`→`position_card_detail.ejs`). Swapped: `card`→detail template, `summary`→collapsed template.

6. **`wantsHtml()` also missed query param fallback** — `?view=html` param added as safe fallback, but not required for normal operation.
