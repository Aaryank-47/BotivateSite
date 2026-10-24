import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function ScrollToTop() {
  const { pathname, hash, state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (state?.scrollToFooter) {
      const timer = setTimeout(() => {
        const element = document.querySelector('footer');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          requestAnimationFrame(() => ScrollTrigger.refresh());
        }
        // Clear history state so refresh doesn't trigger scroll again
        navigate(pathname, { replace: true, state: {} });
      }, 150);
      return () => clearTimeout(timer);
    } else if (hash) {
      const timer = setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          requestAnimationFrame(() => ScrollTrigger.refresh());
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo(0, 0);
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }
  }, [pathname, hash, state, navigate]);

  return null;
}
