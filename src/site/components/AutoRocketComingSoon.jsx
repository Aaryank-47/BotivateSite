import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaLinkedin, FaInstagram, FaXTwitter, FaWhatsapp } from 'react-icons/fa6';
import './AutoRocketComingSoon.css';

export default function AutoRocketComingSoon() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <div className="r-cs-container">
      {/* ── Background Space Sketched SVGs ── */}
      <div className="r-cs-space-overlay" aria-hidden="true">
        {/* Planet 1 (Top Left) */}
        <svg className="r-cs-svg-planet-1" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="22" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" fill="none" />
          <ellipse cx="50" cy="50" rx="42" ry="10" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" fill="none" transform="rotate(-25 50 50)" />
        </svg>

        {/* Sketched stars */}
        <div className="r-cs-stars">
          {[
            { top: '12%', left: '30%', size: 18 },
            { top: '22%', left: '32%', size: 10 },
            { top: '15%', left: '60%', size: 14 },
            { top: '28%', left: '55%', size: 16 },
            { top: '48%', left: '28%', size: 12 },
            { top: '42%', left: '68%', size: 11 },
          ].map((star, i) => (
            <svg 
              key={i} 
              className="r-cs-star" 
              style={{ top: star.top, left: star.left, width: star.size, height: star.size }} 
              viewBox="0 0 24 24"
            >
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" fill="rgba(255,255,255,0.25)" />
            </svg>
          ))}
        </div>

        {/* Orbit/Planet Horizon Curve at Bottom */}
        <div className="r-cs-horizon" />
      </div>

      {/* ── HEADER ── */}
      <header className="r-cs-header">
        <div className="r-cs-logo">
          <svg className="r-cs-logo-planet" viewBox="0 0 100 100" fill="none" stroke="#ffffff" strokeWidth="6">
            <circle cx="50" cy="50" r="24" />
            <ellipse cx="50" cy="50" rx="46" ry="12" transform="rotate(-30 50 50)" />
          </svg>
          <span className="r-cs-logo-text">BOTIVATE.</span>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="r-cs-main">
        {/* Generated 3D Rocket Robot Asset */}
        <div className="r-cs-hero-wrap">
          <motion.img 
            src="/robot-on-rocket.png" 
            alt="AutoRocket Robot" 
            className="r-cs-hero-img"
            initial={{ y: 15 }}
            animate={{ y: -15 }}
            transition={{
              duration: 3,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          />
        </div>

        {/* Subscription / Launch Notification Area */}
        <div className="r-cs-form-wrap">
          <h2 className="r-cs-title">STAY TUNED!</h2>

          <div className="r-cs-form-row">
            {/* Left Decorative Arrow */}
            <div className="r-cs-arrow-wrap r-cs-arrow-left" aria-hidden="true">
              <span className="r-cs-arrow-line" />
              <span className="r-cs-arrow-tip">←</span>
            </div>

            {submitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="r-cs-success"
              >
                <span>Awesome! You are subscribed.</span>
              </motion.div>
            ) : (
              <form className="r-cs-form" onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="ENTER YOUR EMAIL ADDRESS"
                  className="r-cs-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="r-cs-submit" aria-label="Submit">
                  <span className="r-cs-check">✓</span>
                </button>
              </form>
            )}

            {/* Right Decorative Arrow */}
            <div className="r-cs-arrow-wrap r-cs-arrow-right" aria-hidden="true">
              <span className="r-cs-arrow-tip">→</span>
              <span className="r-cs-arrow-line" />
            </div>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="r-cs-footer">
        <div className="r-cs-copyright">
          ©Botivate 2026. All rights reserved.
        </div>

        <div className="r-cs-socials">
          <span className="r-cs-social-label">Follow us on social media :</span>
          <a href="https://www.linkedin.com/company/botivate/about" target="_blank" rel="noreferrer" aria-label="LinkedIn"><FaLinkedin /></a>
          <a href="https://www.instagram.com/botivate.in" target="_blank" rel="noreferrer" aria-label="Instagram"><FaInstagram /></a>
          <a href="https://x.com/BOTIVATE192209" target="_blank" rel="noreferrer" aria-label="Twitter"><FaXTwitter /></a>
          <a href="https://wa.me/918871527519" target="_blank" rel="noreferrer" aria-label="WhatsApp"><FaWhatsapp /></a>
        </div>
      </footer>
    </div>
  );
}
