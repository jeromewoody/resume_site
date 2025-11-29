import React from 'react';

/**
 * @typedef {Object} DateInfo
 * @property {Array<{$: {month: string, year: string}}>} date - Array containing date information
 */

/**
 * Position Card Component
 * @param {Object} props
 * @param {string} props.position_id - Unique identifier for the position
 * @param {string} props.company_fk - Company foreign key reference
 * @param {string} [props.staffing_fk] - Optional staffing company foreign key reference
 * @param {string} props.skills_fk - Space-separated list of skill IDs
 * @param {string} props.position_title - Job title
 * @param {'full_time'|'contract'|'freelance'} props.position_type - Type of employment
 * @param {Array<{$: {month: string, year: string}}>} props.date_started - Start date information
 * @param {Array<{$: {month: string, year: string}}>} [props.date_ended] - End date information
 * @param {Array<{summary_item: Array<string>}>} [props.position_summary] - Array of summary points
 */
const PositionCard = ({
  position_id,
  company_fk,
  staffing_fk,
  skills_fk,
  position_title,
  position_type,
  date_started,
  date_ended,
  position_summary
}) => {
  // Format date helper
  const formatDate = (dateArray) => {
    if (!dateArray || !dateArray[0] || !dateArray[0].$) {
      return 'Date not available';
    }
    
    const date = dateArray[0].$;
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[parseInt(date.month) - 1]} ${date.year}`;
  };

  // Convert skills string to array
  const skillsList = skills_fk ? skills_fk.split(' ') : [];

  // Extract summary items
  const summaryItems = position_summary
  ? position_summary.map(item => 
      item.summary_item && Array.isArray(item.summary_item) 
        ? item.summary_item[0] 
        : null
    )
  : [];

  return (
    <article className="position-card">
      <div className="position-content">
        {/* Header Section */}
        <header className="position-header">
          <h3 className="position-title">{position_title}</h3>
          <div className="position-company">
            <span className="company-name">{company_fk}</span>
            {staffing_fk && (
              <>
                <span className="staffing-separator">via</span>
                <span className="staffing-name">{staffing_fk}</span>
              </>
            )}
          </div>
        </header>

        {/* Employment Details */}
        <div className="employment-details">
          <div className="duration">
            <span className="duration-label">Duration: </span>
            <span className="date-range">
              <time className="date-start">{formatDate(date_started)}</time>
              <span className="date-separator"> - </span>
              <time className="date-end">{date_ended ? formatDate(date_ended) : 'Present'}</time>
            </span>
          </div>
          <div className="employment-type">
            <span className="type-label">Employment Type: </span>
            <span className="type-value">
              {position_type && typeof position_type === 'string' 
                ? position_type.replace(/_/g, ' ')
                : 'Not specified'}
            </span>
          </div>
        </div>

        {/* Skills Section */}
        {skillsList.length > 0 && (
          <div className="skills-section">
            <h4 className="skills-title">Technologies & Skills</h4>
            <div className="skills-list">
              {skillsList.map((skill) => (
                <span key={skill} className="skill-tag">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Summary Section */}
        {summaryItems.length > 0 && (
          <div className="summary-section">
            <h4 className="summary-title">Key Responsibilities & Achievements</h4>
            <ul className="summary-list">
              {summaryItems.map((item, index) => (
                <li key={index} className="summary-item">
                  {console.log(item)}
                  {item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
};

export default PositionCard;