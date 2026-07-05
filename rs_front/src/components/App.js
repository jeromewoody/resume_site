import React, { useState, useEffect } from 'react';
import PositionCard from './PositionCard';
import '../styles.css';

const App = () => {
    const [resumeData, setResumeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchResumeData = async () => {
            try {
                const response = await fetch('http://localhost:3001');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setResumeData(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch resume data');
                setLoading(false);
                console.error('Error fetching resume data:', err);
            }
        };

        fetchResumeData();
    }, []);

    if (loading) {
        return (
            <div className="resume-loading">
                <p className="loading-text">Loading resume data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="resume-error">
                <p className="error-text">{error}</p>
            </div>
        );
    }

    // Early return if no data
    if (!resumeData || !resumeData.positions) {
        return (
            <div className="resume-empty">
                <p className="empty-text">No resume data available</p>
            </div>
        );
    }

    return (
        <div className="resume-container">
            {/* Header Section */}
            <header className="resume-header">
                <h1 className="person-name">
                    {resumeData.contact_info?.name}
                </h1>
                <div className="contact-info">
                    <p className="contact-email">{resumeData.contact_info?.email}</p>
                    <p className="contact-phone">{resumeData.contact_info?.phone}</p>
                </div>
            </header>

            {/* Skills Section */}
            {resumeData.skills && resumeData.skills.length > 0 && (
                <section className="skills-section">
                    <h2 className="section-title">Skills</h2>
                    <div className="skills-container">
                        {resumeData.skills.map((skill) => (
                            <span
                                key={skill.skill_id}
                                className="skill-item"
                            >
                                {skill.skill_value}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {/* Positions Section */}
            <section className="experience-section">
                <h2 className="section-title">Experience</h2>
                <div className="positions-container">
                    {resumeData.positions.map((positionData) => {
                        const position = positionData.position;
                        return (
                            <PositionCard
                                key={position.$.position_id}
                                position_id={position.$.position_id}
                                company_fk={position.$.company_fk}
                                staffing_fk={position.$.staffing_fk}
                                skills_fk={position.$.skills_fk}
                                position_title={position.position_title[0]._}
                                position_type={position.position_title[0].$.position_type}
                                date_started={position.date_started}
                                date_ended={position.date_ended}
                                position_summary={position.position_summary?.[0]?.summary_item}
                            />
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default App;