# Interactive Resume Site

A dynamic resume website built with React and D3.js, backed by an Express.js server using XML data.

## Project Structure

- `rs_back/`: Express.js backend server
  - XML-based resume data model
  - RESTful API endpoints
  - Data processing utilities

- `rs_front/`: React.js frontend
  - Interactive D3.js visualizations
  - Component-based UI
  - Responsive design

## Technologies Used

- Frontend: React, D3.js
- Backend: Express.js
- Data: XML, XPath
- Build Tools: Webpack, Babel

## Setup

### Backend
```bash
cd rs_back
npm install
node controller.js
```

### Frontend
```bash
cd rs_front
npm install
npm run build
```

## API Endpoints

- `GET /`: Full resume data
- `GET /position/:id`: Position details
- `GET /skill/:id`: Positions by skill
- `GET /company/:id`: Positions by company
- `GET /staffing/:id`: Positions by staffing agency
- `GET /dates/:start/:end`: Positions within date range
