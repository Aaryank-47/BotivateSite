import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../assets/botivate-logo.svg';
import './Navbar.css';

const links = [
  { label: 'Home',        path: '/',            type: 'route' },
  { 
    label: 'Products', 
    type: 'dropdown',
    items: [
      { label: 'AutoRocket',  path: 'https://www.autorocket.in/',  desc: 'Growth on Autopilot', external: true },
      { label: 'Frog Planner', path: '/frog-planner', desc: 'Smart operations & scheduling' }
    ]
  },
  { label: 'Services',    path: '/services',    type: 'route' },
  { label: 'About',       path: '/about',       type: 'route' },
  { label: 'Contact',     path: '#',            type: 'scroll' },
  // { label: 'Memories',    path: '/memories',    type: 'route' },
  // { label: 'Careers',     path: '/careers',     type: 'route' },
];

function NavLink({ path, type, label, className, style, onClick, children }) {
  if (type === 'route') {
    return (
      <Link to={path} className={className} style={style} onClick={onClick}>
        {children ?? label}
      </Link>
    );
  }
  return (
    <a href={path} className={className} style={style} onClick={onClick}>
      {children ?? label}
    </a>
  );
}

export default function Navbar({ onLoginClick, user }) {
  const [menuOpen, setMenuOpen]   = useState(false);
  const [visible, setVisible]     = useState(true);
  const [productsOpen, setProductsOpen] = useState(false);
  const lastScrollYRef = useRef(0);
  const sepRef = useRef(null);
  const navPillRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      // Don't hide navbar if mobile menu is open
      if (menuOpen) return;

      const currentScrollY = window.scrollY;
      const lastScrollY = lastScrollYRef.current;

      // Always show at the very top
      if (currentScrollY < 50) {
        setVisible(true);
        lastScrollYRef.current = currentScrollY;
        return;
      }

      const diff = currentScrollY - lastScrollY;
      if (Math.abs(diff) > 5) {
        if (diff > 0) {
          // Scrolling down
          setVisible(false);
        } else {
          // Scrolling up
          setVisible(true);
        }
        lastScrollYRef.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menuOpen]);

  useEffect(() => {
    const updateDropdownLeft = () => {
      if (!sepRef.current || !navPillRef.current) return;
      const sRect = sepRef.current.getBoundingClientRect();
      const nRect = navPillRef.current.getBoundingClientRect();
      navPillRef.current.style.setProperty('--products-menu-left', `${sRect.left - nRect.left}px`);
    };
    updateDropdownLeft();
    window.addEventListener('resize', updateDropdownLeft);
    return () => window.removeEventListener('resize', updateDropdownLeft);
  }, []);

  const handleContactClick = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    
    if (location.pathname === '/') {
      const footerElement = document.querySelector('footer');
      if (footerElement) {
        footerElement.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/', { state: { scrollToFooter: true } });
    }
  };

  return (
    <>
      <header className={`nav-host ${visible ? 'is-visible' : 'is-hidden'}`}>
        <nav className="nav-pill" ref={navPillRef}>
          {/* Logo */}
          <Link to="/" className="nav-logo" onClick={() => setMenuOpen(false)}>
            <img
              src={logoImg}
              alt="Botivate"
              className="nav-logo-img"
              style={{ height: '58px', maxHeight: '100%', width: 'auto', objectFit: 'contain', flexShrink: 0, display: 'block' }}
            />
          </Link>

          {/* Center links */}
          <div className="nav-sep" ref={sepRef} />
          <nav className="nav-links" aria-label="Main navigation">
            {links.map((l) => {
              if (l.type === 'dropdown') {
                return (
                  <div key={l.label} className="nav-dropdown-wrapper">
                    <button className="nav-link nav-dropdown-trigger">
                      {l.label}
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="dropdown-chevron">
                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <div className="nav-dropdown-menu single-column-menu">
                      <div className="dropdown-cat-title">Products</div>
                      <div className="dropdown-divider" />
                      <div className="dropdown-items">
                        {l.items.map((item) => (
                          item.external ? (
                            <a
                              key={item.label}
                              href={item.path}
                              className="nav-dropdown-item"
                            >
                              <div className="dropdown-item-title">{item.label}</div>
                              <div className="dropdown-item-desc">{item.desc}</div>
                            </a>
                          ) : (
                            <Link 
                              key={item.label} 
                              to={item.path} 
                              className="nav-dropdown-item"
                            >
                              <div className="dropdown-item-title">{item.label}</div>
                              <div className="dropdown-item-desc">{item.desc}</div>
                            </Link>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              if (l.type === 'scroll') {
                return (
                  <a
                    key={l.label}
                    href={l.path}
                    className="nav-link"
                    onClick={handleContactClick}
                  >
                    {l.label}
                  </a>
                );
              }
              return <NavLink key={l.label} {...l} className="nav-link" />;
            })}
          </nav>

          {/* Right side */}
          <div className="nav-right">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-md">
                Go to Dashboard
              </Link>
            ) : (
              <button className="btn btn-primary btn-md" onClick={onLoginClick}>
                Login
              </button>
            )}
          </div>

          {/* Mobile burger */}
          <button
            className={`nav-burger${menuOpen ? ' is-open' : ''}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className="burger-bar" />
            <span className="burger-bar" />
            <span className="burger-bar" />
          </button>
        </nav>
      </header>

      {/* Mobile overlay */}
      <div className={`nav-overlay${menuOpen ? ' is-open' : ''}`} aria-hidden={!menuOpen} inert={!menuOpen}>
        <div className="nav-overlay-inner">
          <div className="nav-overlay-links">
            {links.map((l, i) => {
              if (l.type === 'dropdown') {
                return (
                  <div key={l.label} className="nav-overlay-dropdown-wrapper">
                    <button
                      className={`nav-overlay-link nav-overlay-dropdown-trigger ${productsOpen ? 'is-expanded' : ''}`}
                      style={{ '--i': i }}
                      onClick={() => setProductsOpen(!productsOpen)}
                    >
                      <span>{l.label}</span>
                      <svg 
                        width="16" height="16" viewBox="0 0 16 16" fill="none" 
                        style={{ transform: productsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                      >
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <div className={`nav-overlay-dropdown-menu ${productsOpen ? 'is-open' : ''}`}>
                      <div className="nav-overlay-dropdown-items">
                        {l.items.map((item) => (
                          item.external ? (
                            <a
                              key={item.label}
                              href={item.path}
                              className="nav-overlay-dropdown-item"
                              onClick={() => {
                                setMenuOpen(false);
                                setProductsOpen(false);
                              }}
                            >
                              <div className="dropdown-item-title">{item.label}</div>
                              <div className="dropdown-item-desc">{item.desc}</div>
                            </a>
                          ) : (
                            <Link
                              key={item.label}
                              to={item.path}
                              className="nav-overlay-dropdown-item"
                              onClick={() => {
                                setMenuOpen(false);
                                setProductsOpen(false);
                              }}
                            >
                              <div className="dropdown-item-title">{item.label}</div>
                              <div className="dropdown-item-desc">{item.desc}</div>
                            </Link>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              if (l.type === 'scroll') {
                return (
                  <a
                    key={l.label}
                    href={l.path}
                    className="nav-overlay-link"
                    style={{ '--i': i }}
                    onClick={handleContactClick}
                  >
                    {l.label}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 12l8-8M12 4H6M12 4v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                );
              }
              return (
                <NavLink
                  key={l.label}
                  {...l}
                  className="nav-overlay-link"
                  style={{ '--i': i }}
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 12l8-8M12 4H6M12 4v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </NavLink>
              );
            })}
          </div>
          <div className="nav-overlay-footer">
            {user ? (
              <Link
                to="/dashboard"
                className="btn btn-secondary"
                onClick={() => setMenuOpen(false)}
              >
                Go to Dashboard
              </Link>
            ) : (
              <button
                className="btn btn-secondary"
                onClick={() => { onLoginClick?.(); setMenuOpen(false); }}
              >
                Login
              </button>
            )}
            <a href="#" className="btn btn-primary" onClick={handleContactClick}>
              Book Free Demo
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
