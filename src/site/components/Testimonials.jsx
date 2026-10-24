import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Testimonials.css';

gsap.registerPlugin(ScrollTrigger);

const TESTIMONIALS = [
  {
    mainText: "Before Botivate, our sales team was tracking everything on WhatsApp and Excel. We had no idea where a lead stood unless we personally called someone.",
    highlight: "Now we can see the full pipeline live, follow-ups happen on their own, and the team is actually accountable for their numbers.",
    name: "Anurag Agarwal", role: "Director", company: "Krishna United", initials: "AA", color: "#2563EB"
  },
  {
    mainText: "We tried a couple of other platforms before this. The problem was always the same, too complex and the team just would not use it.",
    highlight: "The adoption happened within the first week itself. And we started seeing real results very quickly after that.",
    name: "Sumeer Chatri", role: "Director", company: "Elem", initials: "SC", color: "#7c3aed"
  },
  {
    mainText: "Running a steel business means juggling purchase, production, inventory and dispatch all at once. Earlier all of this was tracked separately and nobody had the full picture.",
    highlight: "Now everything is connected and I can see what is happening across the business without asking ten different people.",
    name: "Akash Agarwal", role: "MD", company: "Sagar TMT", initials: "AA", color: "#059669"
  },
  {
    mainText: "The maintenance module alone has been worth it for us. We used to have machine breakdowns that nobody saw coming.",
    highlight: "Now the team follows a proper schedule, the history is tracked, and incidents have come down noticeably. It has saved us a lot in unexpected downtime.",
    name: "Jaidhish Passary", role: "Director", company: "Passary Minerals", initials: "JP", color: "#d97706"
  },
  {
    mainText: "In a hospital environment, coordination between departments is everything. Tasks were getting dropped and follow-ups were inconsistent.",
    highlight: "The system helped us build a proper structure for delegation and tracking. It just runs in the background and keeps the whole team aligned.",
    name: "Dr. Ashish Mohibiya", role: "MD", company: "SBH Hospital", initials: "AM", color: "#0891b2"
  },
  {
    mainText: "As a CEO the biggest challenge is knowing what is actually happening versus what people tell you is happening.",
    highlight: "The director dashboard gives me real numbers in real time. I do not have to wait for end-of-day reports that may or may not reflect the ground reality.",
    name: "Pankaj Somani", role: "CEO & Director", company: "Rama Udyog", initials: "PS", color: "#c026d3"
  },
  {
    mainText: "We are in a fast-moving category where order management and dispatch tracking need to be tight.",
    highlight: "Everything is now connected and our response time to customers has improved a lot. The sales team now has full visibility and stops things from slipping.",
    name: "Akash Agarwala", role: "Director", company: "Zoff Masala", initials: "AA", color: "#0284c7"
  },
];

const COL1 = [TESTIMONIALS[0], TESTIMONIALS[3], TESTIMONIALS[6]];
const COL2 = [TESTIMONIALS[1], TESTIMONIALS[4]];
const COL3 = [TESTIMONIALS[2], TESTIMONIALS[5]];

const LOGOS = [
  { src: '/logo-kamdhenu-patcorn.webp', alt: 'Kamdhenu Patcorn' },
  { src: '/logo-jagwani.webp',          alt: 'Jagwani'          },
  { src: '/logo-rma.webp',              alt: 'Rahul Mishra & Associates' },
  { src: '/logo-rbp.webp',              alt: 'RBP'              },
  { src: '/logo-rigga.webp',            alt: 'Rigga'            },
  { src: '/logo-sagar-tmt.webp',        alt: 'Sagar TMT & Pipes' },
  { src: '/logo-hari-keshri.webp',       alt: 'Hari Keshri'      },
  { src: '/logo-vaswani.webp',          alt: 'Vaswani'          },
  { src: '/logo-zoff.webp',             alt: 'Zoff'             },
  { src: '/logo-panorama.webp',         alt: 'Panorama'         },
  { src: '/logo-parekh-sanitary.webp',  alt: 'Parekh Sanitary'  },
  { src: '/logo-passary-v2.webp',          alt: 'Passary'          },
  { src: '/logo-piramal-petroleum.webp',alt: 'Piramal Petroleum'},
  { src: '/logo-rama.webp',             alt: 'Rama'             },
  { src: '/logo-sankalp.webp',          alt: 'Sankalp'          },
  { src: '/logo-sansa.webp',            alt: 'Sansa'            },
  { src: '/logo-sarthak-tmt.webp',      alt: 'Sarthak TMT'      },
  { src: '/logo-sbh.webp',              alt: 'SBH'              },
  { src: '/logo-krishna.webp',          alt: 'Krishna'          },
  { src: '/logo-mad-bakers.webp',       alt: 'Mad Bakers'       },
  { src: '/logo-pahlajanis.webp',       alt: 'Pahlajanis'       },
  { src: '/logo-jainx.webp',            alt: 'Jainx'            },
  { src: '/logo-jjspl.webp',            alt: 'JJSPL'            },
  { src: '/logo-elem-v2.webp',             alt: 'Elem'             },
  { src: '/logo-divine-empire.webp',    alt: 'Divine Empire'    },
  { src: '/logo-chandhok.webp',         alt: 'Chandhok'         },
  { src: '/logo-ace.webp',              alt: 'Ace'              },
  { src: '/logo-affinique.webp',        alt: 'Affinique'        },
  { src: '/logo-delight-foods.webp',    alt: 'Delight Foods'    },
  { src: '/logo-nutech-pipes.webp',     alt: 'NuTech Pipes'     },
  { src: '/logo-mamta-hospital.webp',   alt: 'Mamta Hospital'   },
];

const TRACK_LOGOS = [...LOGOS, ...LOGOS];

export default function Testimonials() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(sectionRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', toggleActions: 'play none none none' }
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="testimonials" id="testimonials" ref={sectionRef}>
      <div className="t-inner">

        <div className="t-header">
          <h2 className="t-headline">
            Our trusted <span className="gradient-text">Clients</span>
          </h2>
          <p className="t-subtext">
            Businesses across India trust Botivate to run their operations, automate workflows, and get full visibility from one platform.
          </p>
        </div>

        {/* ── 3-Column Scrolling Cards ── */}
        <div className="t-scroll-grid">

          <div className="t-col-mask">
            <div className="t-col-track t-track-up" style={{ animationDuration: '30s' }}>
              {[...COL1, ...COL1].map((t, i) => (
                <div key={i} className="t-scroll-card">
                  <p className="t-scroll-quote">
                    {t.mainText} <span className="t-scroll-highlight">{t.highlight}</span>
                  </p>
                  <div className="t-scroll-author">
                    <div className="t-scroll-avatar" style={{ background: t.color }}>{t.initials}</div>
                    <div className="t-scroll-author-info">
                      <span className="t-scroll-name">{t.name}</span>
                      <span className="t-scroll-role">{t.role} at {t.company}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="t-col-mask">
            <div className="t-col-track t-track-down" style={{ animationDuration: '24s' }}>
              {[...COL2, ...COL2].map((t, i) => (
                <div key={i} className="t-scroll-card">
                  <p className="t-scroll-quote">
                    {t.mainText} <span className="t-scroll-highlight">{t.highlight}</span>
                  </p>
                  <div className="t-scroll-author">
                    <div className="t-scroll-avatar" style={{ background: t.color }}>{t.initials}</div>
                    <div className="t-scroll-author-info">
                      <span className="t-scroll-name">{t.name}</span>
                      <span className="t-scroll-role">{t.role} at {t.company}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="t-col-mask">
            <div className="t-col-track t-track-up" style={{ animationDuration: '27s' }}>
              {[...COL3, ...COL3].map((t, i) => (
                <div key={i} className="t-scroll-card">
                  <p className="t-scroll-quote">
                    {t.mainText} <span className="t-scroll-highlight">{t.highlight}</span>
                  </p>
                  <div className="t-scroll-author">
                    <div className="t-scroll-avatar" style={{ background: t.color }}>{t.initials}</div>
                    <div className="t-scroll-author-info">
                      <span className="t-scroll-name">{t.name}</span>
                      <span className="t-scroll-role">{t.role} at {t.company}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── Logo Strip ── */}
        <div className="t-logo-strip">
          <div className="t-logo-mask">
            <div className="t-logo-track">
              {TRACK_LOGOS.map((logo, i) => (
                <div className="t-logo-item" key={i}>
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    loading="eager"
                    draggable="false"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
