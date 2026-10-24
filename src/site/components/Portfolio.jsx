import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Portfolio.css';

gsap.registerPlugin(ScrollTrigger);

const projects = [
  {
    image: '/portfolio-fintech.png',
    title: 'FinFlow Analytics',
    industry: 'Fintech',
    description: 'A real-time financial analytics dashboard with AI-powered insights, portfolio tracking, and automated reporting for institutional investors.',
    tags: ['React', 'Node.js', 'AWS', 'Stripe'],
  },
  {
    image: '/portfolio-ecommerce.png',
    title: 'Luxe Commerce',
    industry: 'E-Commerce',
    description: 'Premium e-commerce platform with personalized recommendations, multi-currency support, and seamless checkout experience.',
    tags: ['Next.js', 'TypeScript', 'PostgreSQL', 'Stripe'],
  },
  {
    image: '/portfolio-cloud.png',
    title: 'CloudPulse Monitor',
    industry: 'Infrastructure',
    description: 'Enterprise-grade cloud monitoring solution with real-time alerts, auto-scaling management, and cost optimization analytics.',
    tags: ['React', 'Docker', 'AWS', 'Node.js'],
  },
];

export default function Portfolio() {
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardsRef.current,
        { opacity: 0, y: 60 },
        {
          opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="portfolio" id="portfolio" ref={sectionRef}>
      <div className="portfolio-grid">
        {projects.map((project, i) => (
          <div
            key={i}
            className="portfolio-card hoverable"
            ref={(el) => (cardsRef.current[i] = el)}
          >
            <div className="portfolio-image">
              <img src={project.image} alt={project.title} loading="lazy" />
              <div className="portfolio-overlay">
                <p className="portfolio-overlay-text">{project.description}</p>
              </div>
            </div>
            <div className="portfolio-body">
              <h3>{project.title}</h3>
              <p className="portfolio-meta">{project.industry}</p>
              <div className="portfolio-tags">
                {project.tags.map((tag) => (
                  <span key={tag} className="portfolio-tag">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
