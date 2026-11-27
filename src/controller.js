var express = require('express');
var path = require('path');
var fs = require('fs');
const cors = require('cors');
const ejs = require('ejs');
var application = express();

// EJS setup
application.set('view engine', 'ejs');
application.set('views', path.join(__dirname, 'views'));
application.use(express.urlencoded({ extended: true }));
application.use(express.json());
application.use(cors());

// Serve static CSS
application.use('/css', express.static(path.join(__dirname, 'public/css')));

// Serve static images
application.use('/images', express.static(path.join(__dirname, 'public/images')));

const { build } = require('./data/model');
const analytics = require('./data/analytics');
let resume_data = {};

// Pre-built lookup maps (populated after data loads)
let skillMapById = {};
let companyMapById = {};
let staffingMapById = {};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// Helper functions
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(dateObj) {
  if (!dateObj) return 'Unknown';
  var month = dateObj.$ ? dateObj.$.month : dateObj.month;
  var year = dateObj.$ ? dateObj.$.year : dateObj.year;
  var monthIdx = parseInt(month) - 1;
  if (monthIdx < 0 || monthIdx > 11) monthIdx = 0;
  return MONTHS[monthIdx] + ' ' + year;
}

function formatType(type) {
  switch (type) {
    case 'full_time': return 'Full Time';
    case 'contract': return 'Contract';
    case 'freelance': return 'Freelance';
    default: return type || 'Full Time';
  }
}

function getCompanyName(companyId) {
  if (!companyId || !companyMapById[companyId]) return companyId || 'Unknown';
  return companyMapById[companyId] || companyId;
}

function getStaffingName(staffingId) {
  if (!staffingId || !staffingMapById[staffingId]) return staffingId || '';
  return staffingMapById[staffingId] || '';
}

function getPositionType(position) {
  var titleObj = position.position_title;
  if (Array.isArray(titleObj)) { titleObj = titleObj[0]; }
  if (titleObj && titleObj.$) return titleObj.$.position_type;
  return 'full_time';
}

function getSkillsForPosition(skillIdsStr) {
  if (!skillIdsStr) return [];
  var ids = String(skillIdsStr).split(/\s+/).filter(Boolean);
  var result = [];
  for (var i = 0; i < ids.length; i++) {
    var s = skillMapById[ids[i]];
    if (s) result.push(s);
  }
  return result;
}

function getPositionTitle(position) {
  var titleObj = position.position_title;
  if (Array.isArray(titleObj)) { titleObj = titleObj[0]; }
  if (titleObj && titleObj._) return String(titleObj._);
  return '';
}

function getStartYearMonth(pos) {
  var ds = pos.date_started;
  if (Array.isArray(ds)) ds = ds[0];
  if (!ds) return 0;
  var year = ds.$ ? parseInt(ds.$.year) : parseInt(ds.year);
  var month = ds.$ ? parseInt(ds.$.month) : parseInt(ds.month);
  return year * 100 + month;
}

function buildLookupMaps() {
  skillMapById = {};
  companyMapById = {};
  staffingMapById = {};

  // Build skill map
  if (resume_data.skills && resume_data.skills.length) {
    resume_data.skills.forEach(function(s) {
      skillMapById[s.skill_id] = { skill_id: s.skill_id, skill_value: s.skill_value };
    });
  }

  // Build company map
  if (resume_data.companies && resume_data.companies.length) {
    resume_data.companies.forEach(function(c) {
      companyMapById[c.company_id] = c.company_name;
    });
  }

  // Build staffing map — staffing firms are stored in the XML but may not be
  // in the main model. We extract them from positions that reference them.
  // staffing_fk values in XML are like "lg_consulting", and the staffing_name
  // is "LG Consulting". We map by parsing known patterns.
  var staffingDefaults = {
    'lg_consulting': 'LG Consulting',
    'aim_consulting': 'AIM Consulting',
    'rylem': 'Rylem',
    'creative_circle': 'Creative Circle',
    'greythorn': 'Greythorn',
    'parker_staffing': 'Parker Staffing',
    'redmond_tech': 'Redmond Technology Partners',
    'aditi_staffing': 'Aditi Staffing'
  };

  var allStaffingIds = new Set();
  if (resume_data.positions) {
    resume_data.positions.forEach(function(p) {
      if (p.$ && p.$.staffing_fk) {
        allStaffingIds.add(p.$.staffing_fk);
      }
    });
  }

  allStaffingIds.forEach(function(id) {
    if (staffingDefaults[id]) {
      staffingMapById[id] = staffingDefaults[id];
    } else {
      // Fallback: convert snake_case to Title Case
      staffingMapById[id] = id.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
    }
  });
}

// Start loading data
(async () => {
  try {
    resume_data = await build('./data/jerome_woody_resume.xml');
    buildLookupMaps();
    console.log('Resume data loaded: ' + (resume_data.positions ? resume_data.positions.length : 0) + ' positions');
  } catch (error) {
    console.error('Error building resume data:', error);
  }
  // Boot-time DTD validation — powers the footer badge (xmllint optional).
  application.locals.xmlValid = validateResumeXml();
  application.locals.stats = computeResumeStats();
})();

// Boot-time check against resume.dtd; null when xmllint isn't installed.
function validateResumeXml() {
  var execFileSync = require('child_process').execFileSync;
  var xmlFile = require('path').join(__dirname, 'data', 'jerome_woody_resume.xml');
  try {
    execFileSync('xmllint', ['--noout', '--valid', xmlFile], { stdio: 'pipe' });
    return true;
  } catch (e) {
    if (e && e.code === 'ENOENT') return null;
    return false;
  }
}

// Headline numbers for the hero stat strip, derived from the data (never hardcoded).
function computeResumeStats() {
  var positions = (resume_data && resume_data.positions) || [];
  if (positions.length === 0) return null;
  var now = new Date();
  var currentYear = now.getFullYear();
  var minStartY = null;
  var maxEndY = null;
  var usedSkills = new Set();
  positions.forEach(function(p) {
    var s = p.date_started && p.date_started.$;
    var e = p.date_ended && p.date_ended.$;
    if (s) {
      var sy = parseInt(s.year, 10);
      if (minStartY === null || sy < minStartY) minStartY = sy;
    }
    var ey = e ? parseInt(e.year, 10) : currentYear;
    if (maxEndY === null || ey > maxEndY) maxEndY = ey;
    String((p.$ && p.$.skills_fk) || '').split(/\s+/).filter(Boolean).forEach(function(id) { usedSkills.add(id); });
  });
  return {
    years: Math.max(1, maxEndY - minStartY),
    positions: positions.length,
    skills: usedSkills.size
  };
}

// Timeline state for a single row rendered standalone (HTMX fragments);
// mirrors what position_list computes for the full list.
function positionTimelineState(position) {
  var now = new Date();
  var nowYm = now.getFullYear() * 100 + (now.getMonth() + 1);
  function ym(d) {
    return (d && d.$) ? parseInt(d.$.year, 10) * 100 + parseInt(d.$.month, 10) : null;
  }
  var endYm = ym(position.date_ended);
  var isCurrent = endYm === null || endYm >= nowYm;
  var latestId = null;
  var maxEnd = null;
  (resume_data && resume_data.positions || []).forEach(function(p) {
    var ey = ym(p.date_ended);
    if (ey === null) ey = nowYm;
    if (maxEnd === null || ey > maxEnd) { maxEnd = ey; latestId = p.$.position_id; }
  });
  return { isCurrent: isCurrent, isLatest: position.$.position_id === latestId };
}

// Listen on HOST:PORT (both env-configurable; defaults preserve prior behavior)
const host = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 3001;

application.listen(port, host, () => {
  console.log(`Server listening on ${host}:${port}`);
});

// Helper: check if request wants HTML
function wantsHtml(req) {
  var accept = req.headers.accept || '';
  // HTMX 2.x may not send Accept: text/html, but always sends hx-request/hx-Request
  if (req.headers['hx-request'] === 'true' || req.headers['hx-request'] === '1') return true;
  return accept.includes('text/html') && !accept.includes('application/json');
}

// Helper: render positions as HTML fragment
function renderPositionList(res, positions, isFullPage) {
  res.render('position_list', {
    positions: positions,
    escapeHtml: escapeHtml,
    formatDate: formatDate,
    formatType: formatType,
    getSkillsForPosition: getSkillsForPosition,
    getCompanyName: getCompanyName,
    getStaffingName: getStaffingName,
    isFullPage: !!isFullPage
  });
}

// ============================================================
// GET / — Main page (HTML) or full JSON dump
// ============================================================
application.get('/', (req, res) => {
  if (wantsHtml(req)) {
    var positions = resume_data.positions ? [...resume_data.positions] : [];
    // Sort by date (newest first)
    positions.sort((a, b) => getStartYearMonth(b) - getStartYearMonth(a));

    // Only show skill items referenced by position cards (skills_fk)
    var usedSkillIds = new Set();
    if (positions && skillMapById) {
      positions.forEach(function(p) {
        if (p.$ && p.$.skills_fk) {
          String(p.$.skills_fk).split(/\s+/).filter(Boolean).forEach(function(id) {
            usedSkillIds.add(id);
          });
        }
      });
    }
    var visibleSkills = resume_data.skills ? resume_data.skills.filter(function(s) { return usedSkillIds.has(s.skill_id); }) : [];

    res.render('layout', {
      title: 'CV of Jerome Woody',
      body: ejs.render(fs.readFileSync(path.join(__dirname, 'views', 'index.ejs'), 'utf-8'), {
        contact_info: resume_data.contact_info,
        skills: visibleSkills,
        specialization_groups: resume_data.specialization_groups,
        positions: positions,
        companies: resume_data.companies,
        escapeHtml: escapeHtml,
        formatDate: formatDate,
        formatType: formatType,
        getSkillsForPosition: getSkillsForPosition,
        getCompanyName: getCompanyName,
        getStaffingName: getStaffingName
      }, { views: [path.join(__dirname, 'views')] }),
      contact_info: resume_data.contact_info,
      escapeHtml: escapeHtml
    });
  } else {
    res.set('content-type', 'application/json');
    res.send(JSON.stringify(resume_data));
  }
});

// ============================================================
// GET /position/:id — Single position (full page with nav) or JSON object
// ============================================================
application.get('/position/:id', (req, res) => {
  const positions = resume_data.positions;
  if (!positions) { res.send('{}'); return; }

  var position_map = {};
  positions.forEach(element => position_map[element.$.position_id] = element);
  var position_lookup = position_map[req.params.id];

  if (wantsHtml(req)) {
    var detailBody = ejs.render(fs.readFileSync(path.join(__dirname, 'views', 'position_detail.ejs'), 'utf-8'), {
      position: position_lookup,
      contact_info: resume_data.contact_info,
      skills: resume_data.skills,
      escapeHtml: escapeHtml,
      formatDate: formatDate,
      formatType: formatType,
      getSkillsForPosition: getSkillsForPosition,
      getCompanyName: getCompanyName,
      getStaffingName: getStaffingName
    }, { views: [path.join(__dirname, 'views')] });

    res.render('layout', {
      title: position_lookup ? (getPositionTitle(position_lookup) || 'Position Detail') : 'Position Not Found',
      body: detailBody,
      contact_info: resume_data.contact_info,
      escapeHtml: escapeHtml
    });
  } else {
    res.set('content-type', 'application/json');
    res.send(JSON.stringify(position_lookup || {}));
  }
});

// ============================================================
// GET /skill/:id — Positions by skill
// ============================================================
application.get('/skill/:id', (req, res) => {
  var positions = resume_data.positions;
  if (!positions) { res.send('[]'); return; }

  var skills_map = {};
  positions.forEach(element => {
    var skills_list = element.$.skills_fk;
    var skills_array = skills_list.split(' ');
    skills_array.forEach(skill => {
      if (!skills_map.hasOwnProperty(skill)) { skills_map[skill] = []; }
      skills_map[skill].push(element);
    });
  });
  var skills_lookup = skills_map[req.params.id];
  if (!skills_lookup) skills_lookup = [];

  if (wantsHtml(req)) {
    renderPositionList(res, skills_lookup);
  } else {
    res.set('content-type', 'application/json');
    res.send(JSON.stringify(skills_lookup));
  }
});

// ============================================================
// GET /company/:id — Positions by company
// ============================================================
application.get('/company/:id', (req, res) => {
  var positions = resume_data.positions;
  if (!positions) { res.send('[]'); return; }

  var company_map = {};
  positions.forEach(element => {
    if (!company_map.hasOwnProperty(element.$.company_fk)) {
      company_map[element.$.company_fk] = [];
    }
    company_map[element.$.company_fk].push(element);
  });
  var company_lookup = company_map[req.params.id];
  if (!company_lookup) company_lookup = [];

  if (wantsHtml(req)) {
    renderPositionList(res, company_lookup);
  } else {
    res.set('content-type', 'application/json');
    res.send(JSON.stringify(company_lookup));
  }
});

// ============================================================
// GET /staffing/:id — Positions by staffing firm
// ============================================================
application.get('/staffing/:id', (req, res) => {
  var positions = resume_data.positions;
  if (!positions) { res.send('[]'); return; }

  var staffing_map = {};
  positions.forEach(element => {
    if (!staffing_map.hasOwnProperty(element.$.staffing_fk)) {
      staffing_map[element.$.staffing_fk] = [];
    }
    staffing_map[element.$.staffing_fk].push(element);
  });
  var staffing_lookup = staffing_map[req.params.id];
  if (!staffing_lookup) staffing_lookup = [];

  if (wantsHtml(req)) {
    renderPositionList(res, staffing_lookup);
  } else {
    res.set('content-type', 'application/json');
    res.send(JSON.stringify(staffing_lookup));
  }
});

// ============================================================
// GET /dates/:start/:end — Positions in date range
// ============================================================
application.get('/dates/:start/:end', (req, res) => {
  var positions = resume_data.positions;
  if (!positions) { res.send('[]'); return; }

  var [startYear, startMonth] = req.params.start.split('-').map(Number);
  var [endYear, endMonth] = req.params.end.split('-').map(Number);

  var isDateInRange = (position) => {
    // model.build() flattens dates to single { $: {year, month} } objects (see AGENTS.md)
    var ds = position.date_started;
    if (!ds || !ds.$) return false;
    var posStartYear = parseInt(ds.$.year);
    var posStartMonth = parseInt(ds.$.month);
    var posEndYear, posEndMonth;
    if (position.date_ended && position.date_ended.$) {
      posEndYear = parseInt(position.date_ended.$.year);
      posEndMonth = parseInt(position.date_ended.$.month);
    } else {
      var currentDate = new Date();
      posEndYear = currentDate.getFullYear();
      posEndMonth = currentDate.getMonth() + 1;
    }
    var rangeStart = startYear * 100 + startMonth;
    var rangeEnd = endYear * 100 + endMonth;
    var posStart = posStartYear * 100 + posStartMonth;
    var posEnd = posEndYear * 100 + posEndMonth;
    return (
      (posStart >= rangeStart && posStart <= rangeEnd) ||
      (posEnd >= rangeStart && posEnd <= rangeEnd) ||
      (posStart <= rangeStart && posEnd >= rangeEnd)
    );
  };

  var positions_in_range = positions.filter(isDateInRange);
  positions_in_range.sort((a, b) => getStartYearMonth(b) - getStartYearMonth(a));

  if (wantsHtml(req)) {
    renderPositionList(res, positions_in_range);
  } else {
    res.set('content-type', 'application/json');
    res.send(JSON.stringify(positions_in_range));
  }
});

// ============================================================
// NEW ROUTES: HTMX-friendly API endpoints
// ============================================================

// GET /api/positions/by-skill/:id — Positions using a skill (HTML fragment or JSON)
application.get('/api/positions/by-skill/:id', (req, res) => {
  var positions = resume_data.positions;
  if (!positions) { res.send('[]'); return; }
  var skillId = req.params.id;
  var filtered = positions.filter(p => p.$.skills_fk && p.$.skills_fk.includes(skillId));
  filtered.sort((a, b) => getStartYearMonth(b) - getStartYearMonth(a));
  if (wantsHtml(req)) {
    renderPositionList(res, filtered);
  } else {
    res.set('content-type', 'application/json');
    res.send(JSON.stringify(filtered));
  }
});

// GET /api/positions/by-company/:id — Positions at a company
application.get('/api/positions/by-company/:id', (req, res) => {
  var positions = resume_data.positions;
  if (!positions) { res.send('[]'); return; }
  var companyId = req.params.id;
  var filtered = positions.filter(p => p.$.company_fk === companyId);
  filtered.sort((a, b) => getStartYearMonth(b) - getStartYearMonth(a));
  if (wantsHtml(req)) {
    renderPositionList(res, filtered);
  } else {
    res.set('content-type', 'application/json');
    res.send(JSON.stringify(filtered));
  }
});

// GET /api/positions/by-year/:year — Positions starting in a year
application.get('/api/positions/by-year/:year', (req, res) => {
  var positions = resume_data.positions;
  if (!positions) { res.send('[]'); return; }
  var year = parseInt(req.params.year);
  var filtered = positions.filter(p => {
    var ym = getStartYearMonth(p);
    return Math.floor(ym / 100) === year;
  });
  filtered.sort((a, b) => getStartYearMonth(b) - getStartYearMonth(a));
  if (wantsHtml(req)) {
    renderPositionList(res, filtered);
  } else {
    res.set('content-type', 'application/json');
    res.send(JSON.stringify(filtered));
  }
});

// POST /api/filter — Compound filter endpoint
application.post('/api/filter', (req, res) => {
  var positions = resume_data.positions ? [...resume_data.positions] : [];
  var body = req.body;

  // Filter by skill
  if (body.skill && body.skill.length) {
    var skills = Array.isArray(body.skill) ? body.skill : [body.skill];
    positions = positions.filter(p => {
      if (!p.$.skills_fk) return false;
      var posSkills = p.$.skills_fk.split(/\s+/);
      return skills.some(s => posSkills.includes(s));
    });
  }

  // Filter by company
  if (body.company && body.company.length) {
    var companies = Array.isArray(body.company) ? body.company : [body.company];
    positions = positions.filter(p => companies.includes(p.$.company_fk));
  }

  // Filter by employment type
  if (body.type && body.type.length) {
    var types = Array.isArray(body.type) ? body.type : [body.type];
    positions = positions.filter(p => {
      var titleObj = p.position_title;
      if (Array.isArray(titleObj)) titleObj = titleObj[0];
      var ptype = titleObj && titleObj.$ ? titleObj.$.position_type : 'full_time';
      return types.includes(ptype);
    });
  }

  // Filter by search text
  if (body.search && body.search.trim()) {
    var searchText = body.search.trim().toLowerCase();
    positions = positions.filter(p => {
      // Search by position title
      var titleObj = p.position_title;
      if (Array.isArray(titleObj)) titleObj = titleObj[0];
      var title = titleObj && titleObj._ ? titleObj._.toLowerCase() : '';
      if (title.includes(searchText)) return true;
      // Search by company name
      var compName = getCompanyName(p.$.company_fk) || '';
      if (compName.toLowerCase().includes(searchText)) return true;
      // Search by skills
      var skills = getSkillsForPosition(p.$.skills_fk);
      for (var i = 0; i < skills.length; i++) {
        if (skills[i].skill_value.toLowerCase().includes(searchText)) return true;
      }
      return false;
    });
  }

  // Filter by year range
  var year_from = body.year_from ? parseInt(body.year_from) : null;
  var year_to = body.year_to ? parseInt(body.year_to) : null;
  if (year_from || year_to) {
    var from = year_from || 0;
    var to = year_to || 9999;
    positions = positions.filter(p => {
      var ym = getStartYearMonth(p);
      var year = Math.floor(ym / 100);
      return year >= from && year <= to;
    });
  }

  // Sort by date (newest first)
  positions.sort((a, b) => getStartYearMonth(b) - getStartYearMonth(a));

  if (wantsHtml(req)) {
    renderPositionList(res, positions);
  } else {
    res.set('content-type', 'application/json');
    res.send(JSON.stringify(positions));
  }
});

// ============================================================
// NEW ROUTES: Position card expansion (HTMX)
// ============================================================

// GET /api/position/:id/card — Return expanded card (details view)
application.get('/api/position/:id/card', (req, res) => {
  var positions = resume_data.positions;
  if (!positions) { res.send(''); return; }

  var position = null;
  for (var i = 0; i < positions.length; i++) {
    if (positions[i].$ && positions[i].$.position_id === req.params.id) {
      position = positions[i];
      break;
    }
  }
  if (!position) { res.send(''); return; }

  // Extract position data
  var posId = position.$.position_id;
  var companyFk = position.$.company_fk;
  var staffingFk = position.$.staffing_fk;
  var skillsFk = position.$.skills_fk;

  var titleObj = position.position_title;
  if (Array.isArray(titleObj)) titleObj = titleObj[0];
  var posType = titleObj.$ ? titleObj.$.position_type : 'full_time';
  var posTitle = titleObj._ || '';

  var dateStarted = position.date_started;
  if (Array.isArray(dateStarted)) dateStarted = dateStarted[0];
  var dateEnded = position.date_ended;
  if (dateEnded) {
    if (Array.isArray(dateEnded)) dateEnded = dateEnded[0];
  }

  var skills = getSkillsForPosition(skillsFk);
  var companyName = getCompanyName(companyFk);
  var staffingName = getStaffingName(staffingFk);

  if (wantsHtml(req)) {
    var _tl = positionTimelineState(position);
    res.render('position_card_detail', {
      posId: posId,
      posTitle: posTitle,
      companyName: companyName,
      staffingName: staffingName,
      dateStarted: dateStarted,
      dateEnded: dateEnded,
      positionType: posType,
      skills: skills,
      summaryItems: position.summary_items,
      isCurrent: _tl.isCurrent,
      isLatest: _tl.isLatest,
      escapeHtml: escapeHtml,
      formatDate: formatDate,
      formatType: formatType
    });
  } else {
    res.set('content-type', 'application/json');
    res.send(JSON.stringify({
      posId: posId,
      posTitle: posTitle,
      companyName: companyName,
      staffingName: staffingName,
      dateStarted: dateStarted,
      dateEnded: dateEnded,
      positionType: posType,
      skills: skills,
      summaryItems: position.summary_items
    }));
  }
});

// GET /api/position/:id/summary — Return collapsed card (summary view)
application.get('/api/position/:id/summary', (req, res) => {
  var positions = resume_data.positions;
  if (!positions) { res.send(''); return; }

  var position = null;
  for (var i = 0; i < positions.length; i++) {
    if (positions[i].$ && positions[i].$.position_id === req.params.id) {
      position = positions[i];
      break;
    }
  }
  if (!position) { res.send(''); return; }

  // Extract position data
  var posId = position.$.position_id;
  var companyFk = position.$.company_fk;
  var staffingFk = position.$.staffing_fk;
  var skillsFk = position.$.skills_fk;

  var titleObj = position.position_title;
  if (Array.isArray(titleObj)) titleObj = titleObj[0];
  var posType = titleObj.$ ? titleObj.$.position_type : 'full_time';
  var posTitle = titleObj._ || '';

  var dateStarted = position.date_started;
  if (Array.isArray(dateStarted)) dateStarted = dateStarted[0];
  var dateEnded = position.date_ended;
  if (dateEnded) {
    if (Array.isArray(dateEnded)) dateEnded = dateEnded[0];
  }

  var skills = getSkillsForPosition(skillsFk);
  var companyName = getCompanyName(companyFk);
  var staffingName = getStaffingName(staffingFk);

  if (wantsHtml(req)) {
    var _tl = positionTimelineState(position);
    res.render('position_card', {
      posId: posId,
      posTitle: posTitle,
      companyName: companyName,
      staffingName: staffingName,
      dateStarted: dateStarted,
      dateEnded: dateEnded,
      positionType: posType,
      skills: skills,
      summaryItems: position.summary_items,
      isCurrent: _tl.isCurrent,
      isLatest: _tl.isLatest,
      escapeHtml: escapeHtml,
      formatDate: formatDate,
      formatType: formatType
    });
  } else {
    res.set('content-type', 'application/json');
    res.send(JSON.stringify({
      posId: posId,
      posTitle: posTitle,
      companyName: companyName,
      staffingName: staffingName,
      dateStarted: dateStarted,
      dateEnded: dateEnded,
      positionType: posType,
      skills: skills,
      summaryItems: position.summary_items
    }));
  }
});

// ============================================================
// ANALYTICS ROUTES: Data endpoints for D3 visualizations
// ============================================================

// GET /analytics — All analytics data in one endpoint
application.get('/analytics', (req, res) => {
  if (!resume_data.positions || resume_data.positions.length === 0) {
    res.json({});
    return;
  }

  res.json({
    skill_frequency: analytics.skillFrequency(resume_data, skillMapById),
    skill_cooccurrence: analytics.skillCooccurrence(resume_data),
    skills_over_time: analytics.skillsOverTime(resume_data, skillMapById),
    employment_types: analytics.employmentTypeDistribution(resume_data),
    career_timeline: analytics.careerTimeline(resume_data, companyMapById),
    company_tenure: analytics.companyTenure(resume_data, companyMapById),
    staffing: analytics.staffingAnalysis(resume_data, staffingMapById),
    career_phases: analytics.careerPhases(resume_data, skillMapById)
  });
});

// GET /analytics/distribution — Full analytics dashboard (HTML or JSON)
application.get('/analytics/distribution', (req, res) => {
  var et = analytics.employmentTypeDistribution(resume_data);
  var sa = analytics.staffingAnalysis(resume_data, staffingMapById);
  var ct = analytics.companyTenure(resume_data, companyMapById);
  var sf = analytics.skillFrequency(resume_data, skillMapById);
  var ph = analytics.careerPhases(resume_data, skillMapById);
  var sot = analytics.skillsOverTime(resume_data, skillMapById);
   if (wantsHtml(req)) {
    res.render('layout', {
      title: 'Analytics Dashboard',
      body: ejs.render(fs.readFileSync(path.join(__dirname, 'views', 'analytics_dashboard.ejs'), 'utf-8'), {
        employment_types: et,
        staffing: sa,
        company_tenure: ct,
        skill_frequency: sf,
        career_phases: ph,
        skills_over_time: sot
      }, { views: [path.join(__dirname, 'views')] }),
      contact_info: resume_data.contact_info,
      escapeHtml: escapeHtml
    });
  } else {
    res.json({
      employment_types: et,
      staffing: sa,
      company_tenure: ct,
      skill_frequency: sf,
      career_phases: ph,
      skills_over_time: sot
    });
  }
});
