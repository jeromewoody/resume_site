var express = require('express');
const cors = require('cors')
var application = express();

const { build } = require('./data/model');
let resume_data = {};

(async () => {
  try {
    resume_data = await build('./data/jerome_woody_resume.xml');
  } catch (error) {
    console.error('Error building resume data:', error);
  }
})();

// Enable CORS for all routes
application.use(cors());

application.listen(3001);

// Route to return all resume info.

application.get('/',(req, res) => {
    json = JSON.stringify(resume_data);
    res.set('content-type', 'application/json');
    res.send(json);
});

// Route to return resume data for specific position.

application.get('/position/:id', (req, res) => {
    const positions = resume_data.positions;
    const position_map = {};
    positions.forEach(element => position_map[element.position.$.position_id] = element);
    const position_lookup = position_map[req.params.id];
    json = JSON.stringify(position_lookup);
    res.set('content-type', 'application/json');
    res.send(json);
});

// Route to return resume data based on skill used.

application.get('/skill/:id', (req, res) => {
    const positions = resume_data.positions;
    const skills_map = {};
    positions.forEach(element => {
        const skills_list = element.position.$.skills_fk;
        const skills_array = skills_list.split(' ');
        skills_array.forEach(skill => {
            if(!skills_map.hasOwnProperty(skill)) {
                skills_map[skill] = [];
            } 
            skills_map[skill].push(element);
        });
    });
    const skills_lookup = skills_map[req.params.id];
    json = JSON.stringify(skills_lookup);
    res.set('content-type', 'application/json');
    res.send(json);
});

// Route to return resume data based on a specific company.

application.get('/company/:id', (req, res) => {
    const positions = resume_data.positions;
    const company_map = {};
    positions.forEach(element => {
        if(!company_map.hasOwnProperty(element.position.$.company_fk)) {
            company_map[element.position.$.company_fk] = [];
        }
        company_map[element.position.$.company_fk].push(element);
    });
    const company_lookup = company_map[req.params.id];
    json = JSON.stringify(company_lookup);
    res.set('content-type', 'application/json');
    res.send(json);
});

// Route to return resume data based on a specific staffing firm.

application.get('/staffing/:id', (req, res) => {
    const positions = resume_data.positions;
    const staffing_map = {};
    positions.forEach(element => {
        if(!staffing_map.hasOwnProperty(element.position.$.staffing_fk)) {
            staffing_map[element.position.$.staffing_fk] = [];
        }
        staffing_map[element.position.$.staffing_fk].push(element);
    });
    const staffing_lookup = staffing_map[req.params.id];
    json = JSON.stringify(staffing_lookup);
    res.set('content-type', 'application/json');
    res.send(json);
});

//TODO: Add Route to return resume data from a specific range of dates.

// Route to return resume data from a specific range of dates
application.get('/dates/:start/:end', (req, res) => {
    const positions = resume_data.positions;
    
    // Parse start and end dates from parameters (expected format: YYYY-MM)
    const [startYear, startMonth] = req.params.start.split('-').map(Number);
    const [endYear, endMonth] = req.params.end.split('-').map(Number);
    
    // Helper function to compare dates
    const isDateInRange = (position) => {
        const posStartYear = parseInt(position.position.date_started[0].$.year);
        const posStartMonth = parseInt(position.position.date_started[0].$.month);
        
        // For positions without end date (current positions), use current date
        let posEndYear, posEndMonth;
        if (position.position.date_ended && position.position.date_ended.length > 0) {
            posEndYear = parseInt(position.position.date_ended[0].$.year);
            posEndMonth = parseInt(position.position.date_ended[0].$.month);
        } else {
            const currentDate = new Date();
            posEndYear = currentDate.getFullYear();
            posEndMonth = currentDate.getMonth() + 1;
        }
        
        // Convert all dates to comparable numbers (YYYYMM)
        const rangeStart = startYear * 100 + startMonth;
        const rangeEnd = endYear * 100 + endMonth;
        const posStart = posStartYear * 100 + posStartMonth;
        const posEnd = posEndYear * 100 + posEndMonth;
        
        // Position overlaps with range if:
        // 1. Position starts within range OR
        // 2. Position ends within range OR
        // 3. Position starts before range and ends after range
        return (
            (posStart >= rangeStart && posStart <= rangeEnd) ||
            (posEnd >= rangeStart && posEnd <= rangeEnd) ||
            (posStart <= rangeStart && posEnd >= rangeEnd)
        );
    };
    
    // Filter positions that fall within the date range
    const positions_in_range = positions.filter(isDateInRange);
    
    // Sort positions by start date (most recent first)
    positions_in_range.sort((a, b) => {
        const aYear = parseInt(a.position.date_started[0].$.year);
        const aMonth = parseInt(a.position.date_started[0].$.month);
        const bYear = parseInt(b.position.date_started[0].$.year);
        const bMonth = parseInt(b.position.date_started[0].$.month);
        
        const aDate = aYear * 100 + aMonth;
        const bDate = bYear * 100 + bMonth;
        
        return bDate - aDate; // Descending order
    });
    
    const json = JSON.stringify(positions_in_range);
    res.set('content-type', 'application/json');
    res.send(json);
});

