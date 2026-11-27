# Interactive Resume Site

A server-rendered interactive resume website built with Express.js and HTMX, backed by XML data.

## Project Structure

```
src/
├── controller.js          # Express server (port 3001)
├── package.json
├── public/css/styles.css  # Static styles
├── views/                 # EJS templates
│   ├── layout.ejs
│   ├── index.ejs
│   ├── filters.ejs
│   ├── header.ejs
│   ├── position_card.ejs
│   ├── position_card_detail.ejs
│   ├── position_detail.ejs
│   └── position_list.ejs
└── data/
    ├── jerome_woody_resume.xml
    ├── model.js           # XML → JS parser
    ├── resume.dtd         # XML DTD schema
    └── resume.xsd         # XML Schema (reference)
```

## Technologies Used

- Frontend: HTMX, vanilla CSS
- Backend: Express.js, EJS
- Data: XML, XPath

## Setup

```bash
cd src
npm install
node controller.js
```

Then open `http://localhost:3001` in your browser.

### Environment variables

| Var | Default | Purpose |
|-----|---------|---------|
| `HOST` | `0.0.0.0` | Bind address |
| `PORT` | `3001` | Listen port |
| `BASE_PATH` | *(empty)* | Mount prefix for reverse-proxy subpath deployments (e.g. `BASE_PATH=/resume` serves the site at `http://host/resume/` behind nginx). Views, static assets, and HTMX/XHR endpoints all honor the prefix. |

## API Endpoints

- `GET /`: Full resume data
- `GET /position/:id`: Position details
- `GET /skill/:id`: Positions by skill
- `GET /company/:id`: Positions by company
- `GET /staffing/:id`: Positions by staffing agency
- `GET /dates/:start/:end`: Positions within date range
