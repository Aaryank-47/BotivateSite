import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import supabase from '../../supabaseClient';
import { setCookie } from '../../utils/jwt';
import './LoginModal.css';

const parsePagination = (value) => {
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { /* keep raw string */ }
  }
  return value;
};

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Clear transient state whenever the modal closes.
  useEffect(() => {
    if (!isOpen) { setError(''); setIsLoading(false); }
  }, [isOpen]);

  // Single form, single `users` table. Role ('admin' | 'employee' | 'company')
  // comes straight from the matched row — no separate login tabs.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!supabase) {
        throw new Error('Local database is unavailable.');
      }

      const { data: userRow, error: fetchError } = await supabase
        .from('users')
        .select('id, username, name, role, company_name, permission, is_active')
        .eq('username', username.trim())
        .eq('password', password)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!userRow) {
        throw new Error('Invalid username or password.');
      }

      if (userRow.is_active === false) {
        throw new Error('This account has been deactivated. Contact your administrator.');
      }

      // Map the DB role onto the role strings the rest of the app expects:
      // roles: employee | company | hod | admin | superadmin.
      const dbRole = userRow.role;
      const appRole = dbRole === 'user' ? 'employee' : dbRole;

      // Turn the permission jsonb ({"all": true} or {"key": true, ...}) into
      // either "all" or an array of permission keys, the format Sidebar expects.
      // Superadmin = always full. Admin & others respect DB permission
      // (so superadmin can grant/revoke User Access on admin accounts).
      let pagination = 'all';
      if (dbRole === 'superadmin') {
        pagination = 'all';
      } else {
        const perm = userRow.permission || {};
        pagination = perm.all === true
          ? 'all'
          : Object.keys(perm).filter((key) => perm[key]);
      }

      const filterData = {
        userId: userRow.id,
        username: userRow.username,
        name: userRow.name,
        isAdmin: dbRole === 'admin' || dbRole === 'superadmin',
        showAllData: dbRole === 'admin' || dbRole === 'superadmin',
        userExists: true,
      };

      const companyData = dbRole === 'company'
        ? {
          companyId: userRow.id,
          companyName: userRow.company_name || userRow.name,
          userId: userRow.id,
        }
        : null;

      if (companyData) {
        localStorage.setItem('company_name', companyData.companyName);
      }

      const sessionData = { role: appRole, username: userRow.username, pagination, filterData, companyData };
      setCookie('userSession', sessionData, 7);
      onLogin(appRole, userRow.username, pagination, filterData, companyData);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div
      className={`site-root lm-backdrop${isOpen ? ' is-open' : ''}`}
      onClick={onClose}
      aria-hidden={!isOpen}
    >
      <div
        className="lm-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Sign in"
      >

        {/* ── Left brand panel ── */}
        <div className="lm-brand">
          {/* Decorative bg */}
          <div className="lm-brand-grid" />
          <div className="lm-orb lm-orb--1" />
          <div className="lm-orb lm-orb--2" />



          {/* Copy */}
          <div className="lm-brand-copy">
            <h3 className="lm-brand-headline">
              The OS for your<br />entire business.
            </h3>
            <p className="lm-brand-sub">
              Production, HRMS, CRM, Finance, plus a complete suite of modules unified in one workspace.
            </p>

            <a href="#learn-more" className="btn btn-white btn-sm" onClick={(e) => { e.preventDefault(); /* Logic to learn more */ }}>
              Explore the platform
            </a>
          </div>

          {/* Floating stat chips */}
          <div className="lm-chip lm-chip--1">
            <span className="lm-chip-dot" />
            150+ Clients Automated
          </div>
          <div className="lm-chip lm-chip--2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 20V4M5 11l7-7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            98% Retention Rate
          </div>
          <div className="lm-chip lm-chip--3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            AI Agents Included
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="lm-form-panel">
          {/* Close */}
          <button className="lm-close" onClick={onClose} aria-label="Close">
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <div className="lm-form-header">
            <span className="lm-eyebrow">Botivate Intranet</span>
            <h2 className="lm-title">Welcome back</h2>
            <p className="lm-sub">Sign in to your workspace</p>
          </div>

          <form className="lm-form" onSubmit={handleSubmit} noValidate>
            <div className="lm-form-body">
              {/* Username */}
              <div className="lm-field">
                <label className="lm-label" htmlFor="lm-username">Username <span className="text-red-500">*</span></label>
                <div className="lm-input-wrap">
                  <span className="lm-input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    id="lm-username"
                    className="lm-input"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="lm-field">
                <label className="lm-label" htmlFor="lm-password">Password <span className="text-red-500">*</span></label>
                <div className="lm-input-wrap lm-pw-wrap">
                  <span className="lm-input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </span>
                  <input
                    id="lm-password"
                    className="lm-input"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="lm-pw-toggle"
                    onClick={() => setShowPw((s) => !s)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <path d="M1 1l22 22" />
                        <path d="M9.9 9.9l4.2 4.2" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="lm-error" role="alert">
                  {error}
                </div>
              )}

              {/* Form Options */}
              <div className="lm-form-options">
                <label className="lm-remember">
                  <input type="checkbox" className="lm-checkbox" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="lm-forgot" tabIndex={isOpen ? 0 : -1}>Forgot password?</a>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              <span>{isLoading ? 'Signing in…' : 'Sign In'}</span>
            </button>
          </form>

          <div className="lm-form-footer">
            <p className="lm-footer-text">
              Don't have access?{' '}
              <a href="#contact" className="lm-contact-link" onClick={onClose}>Contact administrator</a>
            </p>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
