import { useEffect, useRef } from 'react';
import './Memories.css';
import gsap from 'gsap';

const memories = [
  {
    title: 'Global Team Retreat 2025',
    category: 'Team Bonding',
    desc: 'Connecting our remote-first engineers, designers, and managers under the sun.',
    date: 'July 2025',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
  },
  {
    title: 'Botivate OS Launch Day',
    category: 'Milestone',
    desc: 'Hitting #1 on Product Hunt and deploying the core workflow engine to our first 500 customers.',
    date: 'October 2024',
    gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)'
  },
  {
    title: 'Summer Hackathon',
    category: 'Innovation',
    desc: '48 hours of pizza, caffeine, and building prototype automation tools. 3 features got shipped!',
    date: 'June 2024',
    gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'
  },
  {
    title: 'First Office Space',
    category: 'Milestone',
    desc: 'Opening our physical workspace hub to foster local collaboration and whiteboarding.',
    date: 'February 2024',
    gradient: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)'
  },
  {
    title: 'Series Seed Funding',
    category: 'Investment',
    desc: 'Partnering with leading SaaS investors to scale our engineering capacity and platform stability.',
    date: 'November 2023',
    gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)'
  },
  {
    title: 'Community Open Source Hub',
    category: 'Community',
    desc: 'Launching our public developer APIs and documentation for custom connector scripts.',
    date: 'August 2023',
    gradient: 'linear-gradient(135deg, #a6c0fe 0%, #f18473 100%)'
  }
];

export default function Memories() {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.memories-title', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: 'power4.out', delay: 0.1 }
      );
      gsap.fromTo('.memories-subtitle', 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: 'power4.out', delay: 0.3 }
      );
      gsap.fromTo('.memory-card', 
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.4 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="memories-wrapper" ref={containerRef}>
      <div className="memories-container">
        <div className="memories-header">
          <span className="memories-tag">COMPANY LIFE</span>
          <h1 className="memories-title">Our Shared Journey</h1>
          <p className="memories-subtitle">
            A visual timeline of key milestones, team adventures, and breakthrough engineering days at Botivate.
          </p>
        </div>

        <div className="memories-grid">
          {memories.map((m, index) => (
            <div key={index} className="memory-card">
              <div className="memory-visual" style={{ background: m.gradient }}>
                <div className="memory-tag">{m.category}</div>
              </div>
              <div className="memory-info">
                <span className="memory-date">{m.date}</span>
                <h3 className="memory-card-title">{m.title}</h3>
                <p className="memory-desc">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
