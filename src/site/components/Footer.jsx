import { HiOutlineGlobeAlt, HiOutlineMapPin, HiOutlinePhone } from 'react-icons/hi2';
import { FaLinkedin, FaInstagram, FaXTwitter, FaWhatsapp } from 'react-icons/fa6';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="footer-logo">BOTIVATE</span>

            <div className="footer-contact-info">
              <span className="footer-address">
                <HiOutlineMapPin />
                <div>
                  Office No. 224, Block I
                  <br />
                  Shri Ram Business Park, Raipur, CG
                </div>
              </span>
              <a href="tel:+918871527519">
                <HiOutlinePhone />
                +91 88715 27519
              </a>

            </div>
          </div>



          <div className="footer-col">
            <h4>Services</h4>
            <span>Retail & E-commerce</span>
            <span>Automation</span>
            <span>Cloud Solutions</span>
            <span>Data Analytics</span>
            <span>Software Development</span>
            <span>Consulting</span>
          </div>

          <div className="footer-col">
            <h4>Contact</h4>
            <a href="mailto:info@botivate.in">info@botivate.in</a>
            <a href="https://wa.me/918871527519" target="_blank" rel="noreferrer">WhatsApp Us</a>
            <a href="#contact">Book Free Demo</a>
            <a href="#founder">About Botivate</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="footer-copyright">
            © {new Date().getFullYear()} BOTIVATE. All rights reserved.
          </span>
          <div className="footer-socials">
            <a href="https://www.linkedin.com/company/botivate/about" target="_blank" rel="noreferrer" className="footer-social hoverable" aria-label="LinkedIn">
              <FaLinkedin />
            </a>
            <a href="https://www.instagram.com/botivate.in" target="_blank" rel="noreferrer" className="footer-social hoverable" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="https://x.com/BOTIVATE192209" target="_blank" rel="noreferrer" className="footer-social hoverable" aria-label="Twitter">
              <FaXTwitter />
            </a>
            <a href="https://wa.me/918871527519" target="_blank" rel="noreferrer" className="footer-social hoverable" aria-label="WhatsApp">
              <FaWhatsapp />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
