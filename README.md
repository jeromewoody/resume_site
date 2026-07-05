# Interactive Resume Site

A server-rendered interactive resume website built with Express.js and HTMX, backed by XML data.

## Project Structure

- `rs_back/`: Express.js backend server
  - XML-based resume data model
  - EJS template rendering
  - HTMX-driven dynamic filtering
  - Dual-mode API (HTML fragments + JSON)

- `rs_front/`: Static frontend assets
  - CSS styles served by Express

## Technologies Used

- Frontend: HTMX, vanilla CSS
- Backend: Express.js, EJS
- Data: XML, XPath

## Setup

```bash
cd rs_back
npm install
node controller.js
```

Then open `http://localhost:3001` in your browser.

## API Endpoints

- `GET /`: Full resume data
- `GET /position/:id`: Position details
- `GET /skill/:id`: Positions by skill
- `GET /company/:id`: Positions by company
- `GET /staffing/:id`: Positions by staffing agency
- `GET /dates/:start/:end`: Positions within date range
