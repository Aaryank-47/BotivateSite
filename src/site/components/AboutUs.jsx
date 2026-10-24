import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './AboutUs.css';

gsap.registerPlugin(ScrollTrigger);

const values = [
  {
    num: '01',
    title: 'System-Driven Operations',
    body: 'Build systems that run without depending on any single individual. When one employee leaves, your operations should not collapse.',
  },
  {
    num: '02',
    title: 'Ground-Level Understanding',
    body: 'Every module was built after observing real businesses breaking down — on factory floors, in warehouses, and inside operations teams.',
  },
  {
    num: '03',
    title: 'Proof Over Assumptions',
    body: 'Verify work with actual proof uploads, checklist validation, and accountability tracking. Not fake done statuses.',
  },
  {
    num: '04',
    title: 'Fast and Deep Customization',
    body: 'Rapid implementation without compromising depth. Your business should not adjust to software — software should adjust to your business.',
  },
];

const journeySteps = [
  {
    num: '01',
    title: 'Started with one goal',
    text: 'One person. One small office in Shankar Nagar, Raipur. One mission — solve real business problems with technology that actually works.',
  },
  {
    num: '02',
    title: 'We went to the ground',
    text: 'Personally visited factories, warehouses, plants, and offices. Not to ask questions — to observe real operations and find where businesses were actually breaking down.',
  },
  {
    num: '03',
    title: 'Built one system at a time',
    text: 'Sales. Inventory. HR. Maintenance. Approvals. AI. Each module connected to the next — until Botivate became a complete Business OS.',
  },
];

const milestones = [
  {
    category: 'Team',
    from: 'Started with 1 person',
    to: '40+ Members',
    sub: 'A growing team united by one purpose',
    isCounter: true,
    targetVal: 40,
  },
  {
    category: 'Headquarters',
    from: 'Shankar Nagar, Raipur',
    to: 'Shree Ram Business Park',
    sub: 'A bigger workspace for a bigger mission',
  },
  {
    category: 'Reach',
    from: 'Started in Raipur',
    to: 'Pan-India',
    sub: 'Delivering automation solutions across the country',
  },
];

const painPoints = [
  { text: 'Sales opportunities missed because follow-ups were delayed or forgotten' },
  { text: 'Teams depending on manual work, WhatsApp chats, and Excel sheets' },
  { text: 'Inventory confusion causing stock mismatches and operational delays' },
  { text: 'No visibility for directors and management on what is actually happening' },
  { text: 'No accountability on who did what, when, and what is still pending' },
  { text: 'Businesses dependent on individuals instead of systems that scale' },
];

export default function AboutUs() {
  const sectionRef      = useRef(null);
  const headerRef       = useRef(null);
  const milestoneRefs   = useRef([]);
  const painHeaderRef   = useRef(null);
  const painGridRef     = useRef(null);
  const resolutionRef   = useRef(null);
  const vmRef           = useRef(null);
  const valuesRef       = useRef(null);
  const ctaRef          = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      gsap.fromTo(headerRef.current,
        { opacity: 0, y: 48 },
        {
          opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: headerRef.current, start: 'top 80%', toggleActions: 'play none none none' },
        }
      );

      const steps = sectionRef.current?.querySelectorAll('.journey-step');
      if (steps?.length) {
        gsap.fromTo(steps,
          { opacity: 0, x: -18 },
          {
            opacity: 1, x: 0, duration: 0.6, stagger: 0.14, ease: 'power3.out',
            scrollTrigger: { trigger: steps[0], start: 'top 82%', toggleActions: 'play none none none' },
          }
        );
      }

      if (milestoneRefs.current.length) {
        milestoneRefs.current.forEach((card) => {
          if (!card) return;

          const innerEl      = card.querySelector('.milestone-inner');
          const valueEl      = card.querySelector('.milestone-value');
          const fromEl       = card.querySelector('.milestone-from');
          const sub          = card.querySelector('.milestone-sub');
          const counterSpan  = card.querySelector('.milestone-counter');

          gsap.set(card,    { opacity: 0, y: 24 });
          gsap.set(valueEl, { opacity: 0, y: 14 });
          gsap.set(fromEl,  { opacity: 0 });
          gsap.set(sub,     { opacity: 0 });

          const tl = gsap.timeline({
            scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none none' },
          });

          tl.to(card,    { opacity: 1, y: 0,  duration: 0.55, ease: 'power3.out' });
          tl.to(valueEl, { opacity: 1, y: 0,  duration: 0.5,  ease: 'power3.out' }, '-=0.3');

          if (counterSpan) {
            const target = parseInt(counterSpan.getAttribute('data-target') || '0', 10);
            const obj = { val: 1 };
            tl.to(obj, {
              val: target,
              duration: 1.4,
              ease: 'power2.out',
              onUpdate: () => { counterSpan.textContent = Math.floor(obj.val); },
            }, '-=0.2');
          }

          tl.to(fromEl, { opacity: 1, duration: 0.4, ease: 'power2.out' }, '-=0.6');
          tl.to(sub,    { opacity: 1, duration: 0.4, ease: 'power2.out' }, '-=0.3');
        });
      }

      gsap.fromTo(painHeaderRef.current,
        { opacity: 0, y: 32 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: painHeaderRef.current, start: 'top 80%', toggleActions: 'play none none none' },
        }
      );

      const painItems = painGridRef.current?.querySelectorAll('.about-pain-item');
      if (painItems?.length) {
        gsap.fromTo(painItems,
          { opacity: 0, y: 24 },
          {
            opacity: 1, y: 0, duration: 0.6, stagger: 0.09, ease: 'power3.out',
            scrollTrigger: { trigger: painGridRef.current, start: 'top 76%', toggleActions: 'play none none none' },
          }
        );
      }

      gsap.fromTo(resolutionRef.current,
        { opacity: 0, y: 36 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: resolutionRef.current, start: 'top 80%', toggleActions: 'play none none none' },
        }
      );

      const vmCards = vmRef.current?.querySelectorAll('.about-vm-card');
      if (vmCards?.length) {
        gsap.fromTo(vmCards,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out',
            scrollTrigger: { trigger: vmRef.current, start: 'top 78%', toggleActions: 'play none none none' },
          }
        );
      }
      const valCards = valuesRef.current?.querySelectorAll('.about-val-card');
      if (valCards?.length) {
        gsap.fromTo(valCards,
          { opacity: 0, y: 32 },
          {
            opacity: 1, y: 0, duration: 0.7, stagger: 0.14, ease: 'power3.out',
            scrollTrigger: { trigger: valuesRef.current, start: 'top 78%', toggleActions: 'play none none none' },
          }
        );
      }

      gsap.fromTo(ctaRef.current,
        { opacity: 0, y: 36 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: ctaRef.current, start: 'top 80%', toggleActions: 'play none none none' },
        }
      );

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="about-us" id="about" ref={sectionRef}>
      <div className="about-circuit-bg" />
      <div className="about-inner">

        {/* ── Header ── */}
        <div className="about-header" ref={headerRef}>
          <span className="section-label">About Botivate</span>
          <h2 className="about-headline">
            Building the Future of<br />
            <span className="gradient-text">Business Automation</span>
          </h2>
          <p className="about-lead">
            At Botivate, we believe businesses should run on systems, not stress, manual work,
            and endless follow-ups. We combine automation, AI, and real business experience into
            one ecosystem that helps companies operate smarter, faster, and more efficiently.
          </p>
        </div>

        {/* ── Journey + Milestones ── */}
        <div className="about-journey-row">

          {/* Story column */}
          <div className="about-story">
            <div className="about-story-tag">Our Journey</div>
            <h3 className="about-story-title">From One Desk to a Business Operating System</h3>
            <div className="journey-steps">
              {journeySteps.map((s) => (
                <div className="journey-step" key={s.num}>
                  <span className="journey-step-num">{s.num}</span>
                  <div className="journey-step-body">
                    <div className="journey-step-title">{s.title}</div>
                    <p className="journey-step-text">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="about-pullquote">
              "Botivate wasn't born inside a boardroom. It was built on the ground."
            </div>
          </div>

          {/* Milestones column */}
          <div className="about-milestones">
            <div className="about-milestones-header">
              <span>Key Milestones</span>
            </div>
            {milestones.map((m, i) => (
              <div
                key={i}
                className="about-milestone"
                ref={(el) => (milestoneRefs.current[i] = el)}
              >
                <div className="milestone-inner">
                  <span className="milestone-category">{m.category}</span>
                  <div className={`milestone-value${m.isCounter ? ' milestone-value--big' : ''}`}>
                    {m.isCounter ? (
                      <><span className="milestone-counter" data-target={m.targetVal}>1</span>+</>
                    ) : (
                      m.to
                    )}
                  </div>
                  {m.isCounter && (
                    <div className="milestone-value-label">Team Members</div>
                  )}
                </div>
                <div className="milestone-from">
                  <span className="milestone-from-label">from</span>{m.from}
                </div>
                <p className="milestone-sub">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Problems Witnessed ── */}
        <div className="about-pain-section">
          <div className="about-pain-header" ref={painHeaderRef}>
            <div className="about-pain-eyebrow">
              We didn&apos;t just hear problems. <span className="gradient-text">We experienced them.</span>
            </div>
            <p className="about-pain-desc">
              Over time, we noticed companies across every industry facing the same operational chaos.
            </p>
          </div>

          <div className="about-pain-grid" ref={painGridRef}>
            {painPoints.map((p, i) => (
              <div key={i} className="about-pain-item">
                <div className="pain-dot" />
                <p>{p.text}</p>
              </div>
            ))}
          </div>

          {/* Resolution callout */}
          <div className="about-resolution" ref={resolutionRef}>
            <div className="about-resolution-glow-a" />
            <div className="about-resolution-glow-b" />
            <div className="about-resolution-content">
              <p className="about-resolution-headline">
                Most businesses didn&apos;t have a software problem.<br />
                They had a <span className="gradient-text">system problem.</span>
              </p>
              <p className="about-resolution-body">
                They didn&apos;t need more tools. They needed one operating system that could connect
                everything together, giving every person, manager, and director complete visibility.
              </p>
            </div>
          </div>
        </div>

        {/* ── Vision & Mission ── */}
        <div className="about-vm" ref={vmRef}>
          <div className="about-vm-card about-vm-vision">
            <div className="about-vm-glow about-vm-glow--blue" />
            <span className="about-vm-tag">Our Vision</span>
            <p className="about-vm-text">
              "To become the world&apos;s #1 force in business automation, empowering companies
              of every size to operate smarter, faster, and effortlessly through intelligent
              systems and AI."
            </p>
          </div>
          <div className="about-vm-card about-vm-mission">
            <div className="about-vm-glow about-vm-glow--cyan" />
            <span className="about-vm-tag">Our Mission</span>
            <p className="about-vm-text">
              "To solve real-world business problems with technology that actually works,
              delivering lightning-fast systems accessible from anywhere, becoming the one-stop
              tech partner for system-driven growth."
            </p>
          </div>
        </div>

        {/* ── Values ── */}
        <div className="about-values" ref={valuesRef}>
          <div className="about-values-header">
            <span className="section-label">Our Values</span>
            <h3 className="about-values-title">The Principles Behind Every Decision</h3>
          </div>
          <div className="about-val-grid">
            {values.map((v) => (
              <div key={v.num} className="about-val-card">
                <span className="about-val-num">{v.num}</span>
                <h4 className="about-val-title">{v.title}</h4>
                <p className="about-val-body">{v.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <div className="about-bottom-cta" ref={ctaRef}>
          <div className="about-cta-glow-a" />
          <div className="about-cta-glow-b" />
          <div className="about-cta-content">
            <h3 className="about-cta-headline">
              Ready to run your entire business<br />from one OS?
            </h3>
            <p className="about-cta-sub">
              Join companies across India that have already transformed their operations with Botivate OS.
            </p>
            <div className="about-cta-buttons">
              <a href="/#contact" className="btn btn-primary btn-lg">Book Free Demo</a>
              <a href="/#contact" className="btn btn-secondary btn-lg">Talk To Our Team</a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
