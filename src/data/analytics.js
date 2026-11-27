/**
 * analytics.js
 * ------------
 * Computes career statistics from the resume model for D3 visualization.
 * 
 * All functions accept the resume_data object (from model.build()) and
 * lookup maps. They return plain JS objects ready for JSON serialization.
 */

/**
 * Compute skill frequency across all positions.
 * Returns: [{ skill_id, skill_name, count, positions: [position_id, ...] }]
 * Sorted by count descending.
 */
function skillFrequency(resume_data, skillMapById) {
  var counts = {};
  var positionIds = {};

  if (resume_data.positions) {
    resume_data.positions.forEach(function(pos) {
      var skills_str = pos.$ && pos.$.skills_fk ? pos.$.skills_fk : '';
      var ids = skills_str.split(/\s+/).filter(Boolean);
      var pos_id = pos.$ && pos.$.position_id;

      ids.forEach(function(skill_id) {
        if (!counts[skill_id]) {
          counts[skill_id] = 0;
          positionIds[skill_id] = [];
        }
        counts[skill_id]++;
        if (pos_id) positionIds[skill_id].push(pos_id);
      });
    });
  }

  return Object.keys(counts).map(function(skill_id) {
    var info = skillMapById[skill_id];
    return {
      skill_id: skill_id,
      skill_name: info ? info.skill_value : skill_id,
      count: counts[skill_id],
      positions: positionIds[skill_id]
    };
  }).sort(function(a, b) { return b.count - a.count; });
}

/**
 * Compute skill co-occurrence pairs.
 * Returns: [{ source, target, count }]  (source < target alphabetically)
 * Only includes pairs that co-occur in at least 2 positions.
 */
function skillCooccurrence(resume_data) {
  var pairCounts = {};

  if (resume_data.positions) {
    resume_data.positions.forEach(function(pos) {
      var skills_str = pos.$ && pos.$.skills_fk ? pos.$.skills_fk : '';
      var ids = skills_str.split(/\s+/).filter(Boolean).sort();

      // Generate all pairs within this position
      for (var i = 0; i < ids.length; i++) {
        for (var j = i + 1; j < ids.length; j++) {
          var key = ids[i] + '|' + ids[j];
          pairCounts[key] = (pairCounts[key] || 0) + 1;
        }
      }
    });
  }

  return Object.keys(pairCounts)
    .filter(function(k) { return pairCounts[k] >= 2; })
    .map(function(key) {
      var parts = key.split('|');
      return {
        source: parts[0],
        target: parts[1],
        count: pairCounts[key]
      };
    })
    .sort(function(a, b) { return b.count - a.count; });
}

/**
 * Compute skill usage over time (yearly).
 * Returns: [{ year, skills: [{ skill_id, skill_name }] }]
 * Skills sorted by frequency within each year.
 */
function skillsOverTime(resume_data, skillMapById) {
  var yearMap = {};

  if (resume_data.positions) {
    resume_data.positions.forEach(function(pos) {
      var start = pos.date_started;
      if (Array.isArray(start)) start = start[0];
      if (!start) return;

      var year = start.$ ? parseInt(start.$.year) : parseInt(start.year);
      var skills_str = pos.$ && pos.$.skills_fk ? pos.$.skills_fk : '';
      var ids = skills_str.split(/\s+/).filter(Boolean);

      if (!yearMap[year]) yearMap[year] = {};
      ids.forEach(function(sid) {
        yearMap[year][sid] = (yearMap[year][sid] || 0) + 1;
      });
    });
  }

  return Object.keys(yearMap)
    .sort(function(a, b) { return parseInt(a) - parseInt(b); })
    .map(function(year) {
      return {
        year: parseInt(year),
        skills: Object.keys(yearMap[year])
          .map(function(sid) {
            var info = skillMapById[sid];
            return {
              skill_id: sid,
              skill_name: info ? info.skill_value : sid,
              count: yearMap[year][sid]
            };
          })
          .sort(function(a, b) { return b.count - a.count; })
      };
    });
}

/**
 * Employment type distribution.
 * Returns: [{ type, label, count, percentage }]
 */
function employmentTypeDistribution(resume_data) {
  var counts = {};

  if (resume_data.positions) {
    resume_data.positions.forEach(function(pos) {
      var title = pos.position_title;
      if (Array.isArray(title)) title = title[0];
      var type = title && title.$ ? title.$.position_type : 'unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
  }

  var total = resume_data.positions ? resume_data.positions.length : 0;
  var labels = { full_time: 'Full Time', contract: 'Contract', freelance: 'Freelance' };

  return Object.keys(counts).map(function(type) {
    return {
      type: type,
      label: labels[type] || type,
      count: counts[type],
      percentage: Math.round(counts[type] / total * 10000) / 100
    };
  }).sort(function(a, b) { return b.count - a.count; });
}

/**
 * Career timeline data (positions with start/end dates and durations).
 * Returns: [{ position_id, title, company, start: 'YYYY-MM', end: 'YYYY-MM' or null, duration_months: number, type }]
 */
function careerTimeline(resume_data, companyMapById) {
  function parseDate(dateObj) {
    if (!dateObj) return null;
    if (Array.isArray(dateObj)) dateObj = dateObj[0];
    var y = dateObj.$ ? parseInt(dateObj.$.year) : parseInt(dateObj.year);
    var m = dateObj.$ ? parseInt(dateObj.$.month) : parseInt(dateObj.month);
    return { year: y, month: m };
  }

  function getEnd(pos) {
    if (!pos.date_ended) return null;
    return parseDate(pos.date_ended);
  }

  function monthsBetween(s, e) {
    return (e.year - s.year) * 12 + (e.month - s.month);
  }

  function getPosTitle(pos) {
    var title = pos.position_title;
    if (Array.isArray(title)) title = title[0];
    return title && title._ ? title._ : '';
  }

  return (resume_data.positions || [])
    .map(function(pos) {
      var start = parseDate(pos.date_started);
      var end = getEnd(pos);
      var company = pos.$ && pos.$.company_fk ? companyMapById[pos.$.company_fk] || pos.$.company_fk : '';

      return {
        position_id: pos.$ && pos.$.position_id,
        title: getPosTitle(pos),
        company: company,
        start: start ? start.year + '-' + String(start.month).padStart(2, '0') : null,
        end: end ? end.year + '-' + String(end.month).padStart(2, '0') : null,
        duration_months: start && end ? monthsBetween(start, end) : null,
        type: pos.$ ? 'position' : ''
      };
    })
    .filter(function(p) { return p.start; })
    .sort(function(a, b) {
      return a.start.localeCompare(b.start);
    });
}

/**
 * Company tenure: duration at each company.
 * Returns: [{ company, start, end, duration_months, position_count }]
 */
function companyTenure(resume_data, companyMapById) {
  var companies = {};

  if (resume_data.positions) {
    resume_data.positions.forEach(function(pos) {
      var fk = pos.$ && pos.$.company_fk;
      if (!fk) return;
      var company = companyMapById[fk] || fk;

      if (!companies[company]) {
        companies[company] = { company: company, positions: [] };
      }

      var start = pos.date_started;
      if (Array.isArray(start)) start = start[0];
      var end = null;
      if (pos.date_ended) {
        end = pos.date_ended;
        if (Array.isArray(end)) end = end[0];
      }

      companies[company].positions.push({
        start: start ? (start.$ ? parseInt(start.$.year) * 100 + parseInt(start.$.month) : parseInt(start.year) * 100 + parseInt(start.month)) : 0,
        end: end ? (end.$ ? parseInt(end.$.year) * 100 + parseInt(end.$.month) : parseInt(end.year) * 100 + parseInt(end.month)) : null
      });
    });
  }

  return Object.values(companies).map(function(c) {
    var sorted = c.positions.sort(function(a, b) { return a.start - b.start; });
    var now = new Date();
    var nowYm = now.getFullYear() * 100 + (now.getMonth() + 1);
    function monthsBetween(start, end) {
      // start/end are YYYYMM ints (year*100+month) — NOT subtractable as months
      var sy = Math.floor(start / 100), sm = start % 100;
      var ey = Math.floor(end / 100),   em = end % 100;
      return Math.max(0, (ey - sy) * 12 + (em - sm));
    }
    var totalMonths = 0;
    sorted.forEach(function(p) {
      if (!p.start) return;
      var end = p.end || nowYm;  // open-ended position = still there (current month)
      totalMonths += monthsBetween(p.start, end);
    });

    return {
      company: c.company,
      position_count: sorted.length,
      total_months: totalMonths,
      total_years: Math.round(totalMonths * 100 / 12) / 100
    };
  }).sort(function(a, b) { return b.total_months - a.total_months; });
}

/**
 * Staffing analysis.
 * Returns: {
 *   direct: { count, percentage },
 *   contract: { count, percentage },
 *   staffing_firms: [{ name, position_count }]
 * }
 */
function staffingAnalysis(resume_data, staffingMapById) {
  var staffingCounts = {};
  var direct = 0;
  var withStaffing = 0;

  if (resume_data.positions) {
    resume_data.positions.forEach(function(pos) {
      var fk = pos.$ && pos.$.staffing_fk;
      if (fk && fk.trim()) {
        withStaffing++;
        var name = staffingMapById[fk] || fk;
        staffingCounts[fk] = { name: name, id: fk };
        if (!staffingCounts[fk].count) staffingCounts[fk].count = 0;
        staffingCounts[fk].count++;
      } else {
        direct++;
      }
    });
  }

  var total = (resume_data.positions || []).length;
  var firms = Object.values(staffingCounts)
    .map(function(f) { return { name: f.name, position_count: f.count }; })
    .sort(function(a, b) { return b.position_count - a.position_count; });

  return {
    direct: { count: direct, percentage: Math.round(direct / total * 10000) / 100 },
    with_staffing: { count: withStaffing, percentage: Math.round(withStaffing / total * 10000) / 100 },
    staffing_firms: firms
  };
}

/**
 * Career phases: group positions into eras based on years, with dominant skills.
 * Returns: [{ phase_name, start_year, end_year, positions: [...], dominant_skills: [...] }]
 */
function careerPhases(resume_data, skillMapById) {
  var years = [];

  if (resume_data.positions) {
    resume_data.positions.forEach(function(pos) {
      var start = pos.date_started;
      if (Array.isArray(start)) start = start[0];
      if (start) {
        var year = start.$ ? parseInt(start.$.year) : parseInt(start.year);
        years.push(year);
      }
    });
  }

  if (years.length === 0) return [];

  var minYear = Math.min.apply(null, years);
  var maxYear = Math.max.apply(null, years);

  // Last activity year (latest end year; open-ended = current year).
  // Positions are bucketed by START year, so without this the trailing
  // phase would be labeled by the last start year only (a 2022 role
  // running to 2026 would make the career look like it ended in 2022).
  var maxEndYear = maxYear;
  var currentYear = new Date().getFullYear();
  resume_data.positions.forEach(function(pos) {
    var end = pos.date_ended;
    if (Array.isArray(end)) end = end[0];
    var ey;
    if (end) ey = end.$ ? parseInt(end.$.year) : parseInt(end.year);
    else if (pos.date_started) ey = currentYear;
    if (ey && ey > maxEndYear) maxEndYear = ey;
  });

  // Create phases: ~5 year intervals
  var phases = [];
  for (var y = minYear; y <= maxYear; y += 5) {
    var phaseStart = y;
    var isLastPhase = (y + 5) > maxYear;
    var phaseEnd = isLastPhase ? maxEndYear : Math.min(y + 4, maxYear);
    var label = phaseStart + '-' + String(phaseEnd).slice(2);

    var skillCounts = {};
    var positions = [];

    resume_data.positions.forEach(function(pos) {
      var start = pos.date_started;
      if (Array.isArray(start)) start = start[0];
      var year = start ? (start.$ ? parseInt(start.$.year) : parseInt(start.year)) : 0;

      if (year >= phaseStart && year <= phaseEnd) {
        positions.push(pos.$ && pos.$.position_id);
        var skills_str = pos.$ && pos.$.skills_fk ? pos.$.skills_fk : '';
        skills_str.split(/\s+/).filter(Boolean).forEach(function(sid) {
          skillCounts[sid] = (skillCounts[sid] || 0) + 1;
        });
      }
    });

    var dominant = Object.keys(skillCounts)
      .sort(function(a, b) { return skillCounts[b] - skillCounts[a]; })
      .slice(0, 8)
      .map(function(sid) {
        var info = skillMapById[sid];
        return { skill_id: sid, skill_name: info ? info.skill_value : sid, count: skillCounts[sid] };
      });

    phases.push({
      phase_name: label,
      start_year: phaseStart,
      end_year: phaseEnd,
      positions: positions,
      dominant_skills: dominant
    });
  }

  return phases;
}

module.exports = {
  skillFrequency: skillFrequency,
  skillCooccurrence: skillCooccurrence,
  skillsOverTime: skillsOverTime,
  employmentTypeDistribution: employmentTypeDistribution,
  careerTimeline: careerTimeline,
  companyTenure: companyTenure,
  staffingAnalysis: staffingAnalysis,
  careerPhases: careerPhases
};
