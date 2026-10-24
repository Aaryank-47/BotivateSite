import './LogoStrip.css';

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

// Duplicate for seamless infinite loop
const TRACK = [...LOGOS, ...LOGOS];

export default function LogoStrip() {
  return (
    <section className="logo-strip" aria-label="Trusted by leading businesses">
      <div className="logo-strip-mask">
        <div className="logo-strip-track">
          {TRACK.map((logo, i) => (
            <div className="logo-strip-item" key={i}>
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
    </section>
  );
}
