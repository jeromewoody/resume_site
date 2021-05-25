var express = require('express');
var application = express();
var resume_data = require('./data/model.js');

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

