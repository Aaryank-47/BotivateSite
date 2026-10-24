import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from './Navbar';
import Footer from './Footer';

const PRODUCT_ROUTES = ['/autorocket'];

gsap.registerPlugin(ScrollTrigger);

export default function Layout({ onLoginClick, user }) {
  const location = useLocation();
  const hasOwnNav = PRODUCT_ROUTES.includes(location.pathname);

  useEffect(() => {
    ScrollTrigger.refresh();
  }, []);

  return (
    <div className="site-root">
      {!hasOwnNav && <Navbar onLoginClick={onLoginClick} user={user} />}
      <main>
        <Outlet />
      </main>
      {!hasOwnNav && <Footer />}
    </div>
  );
}
