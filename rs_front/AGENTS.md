# AGENTS.md

**Purpose**
- Static CSS asset directory for the Express.js server.
- CSS is served at `/css/styles.css` via `app.use('/css', express.static('rs_front/css'))` in `rs_back/controller.js`.

**Files**
- `css/styles.css` - All resume site styles (HTMX loading indicators, layout, position cards, responsive design).
