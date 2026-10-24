import { useEffect, useRef } from 'react';
import './Careers.css';
import gsap from 'gsap';

const jobs = [
  {
    title: 'Senior Full Stack Engineer',
    dept: 'Engineering',
    loc: 'Remote (US / Europe)',
    type: 'Full-time',
    salary: '$140k - $180k + equity'
  },
  {
    title: 'Product Designer',
    dept: 'Design',
    loc: 'Remote (Global)',
    type: 'Full-time',
    salary: '$100k - $130k + equity'
  },
  {
    title: 'Growth Marketing Manager',
    dept: 'Marketing',
    loc: 'Remote (Global)',
    type: 'Full-time',
    salary: '$90k - $120k'
  }
];

export default function Careers() {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.careers-title', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: 'power4.out', delay: 0.1 }
      );
      gsap.fromTo('.careers-subtitle', 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: 'power4.out', delay: 0.3 }
      );
      gsap.fromTo('.job-row', 
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.4 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleApply = (title) => {
    window.location.href = `mailto:careers@botivate.com?subject=Application for ${title}`;
  };

  return (
    <div className="careers-wrapper" ref={containerRef}>
      <div className="careers-container">
        <div className="careers-header">
          <span className="careers-tag">WE ARE HIRING</span>
          <h1 className="careers-title">Join the Mission to Automate Work</h1>
          <p className="careers-subtitle">
            We are looking for creative, high-agency engineers, designers, and marketers who want to redefine how companies organize daily business operations.
          </p>
        </div>

        <div className="careers-list">
          <h2 className="careers-list-title">Open Positions</h2>
          
          <div className="jobs-table">
            {jobs.map((j, index) => (
              <div key={index} className="job-row">
                <div className="job-meta">
                  <span className="job-dept">{j.dept}</span>
                  <h3 className="job-title-text">{j.title}</h3>
                  <div className="job-tags">
                    <span className="job-tag-item">{j.loc}</span>
                    <span className="job-tag-item">{j.type}</span>
                    <span className="job-tag-item highlight-tag">{j.salary}</span>
                  </div>
                </div>
                <div className="job-action">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleApply(j.title)}
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
