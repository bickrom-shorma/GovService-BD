import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated, isAdmin, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const closeMenu = () => setMenuOpen(false);

  const handleServicesClick = () => {
    closeMenu();
    setTimeout(() => {
      const el = document.getElementById('categories');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  const profileLabel = user?.full_name?.trim()?.split(' ')[0] || t('navProfile');

  return (
    <nav className="main-navbar">
      <div className="navbar-container">

        {/* LEFT SECTION: Brand Logo */}
        <div className="navbar-left">
          <Link to="/" className="navbar-brand" onClick={closeMenu}>
            <span className="brand-icon">🏛️</span>
            <span className="brand-text">
              {t('brandMain')} <span>{t('brandSub')}</span>
            </span>
          </Link>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          className={`navbar-toggle ${menuOpen ? 'open' : ''}`}
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={t('toggleNavLabel')}
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        {/* CENTER & RIGHT SECTIONS */}
        <div className={`navbar-menu ${menuOpen ? 'show' : ''}`}>

          {/* CENTER SECTION: Navigation Links */}
          <div className="navbar-center">
            <div className="navbar-links">

              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `navbar-link ${isActive ? 'active' : ''}`
                }
                onClick={closeMenu}
              >
                {t('navHome')}
              </NavLink>

              <NavLink
                to="/"
                end
                className="navbar-link"
                onClick={handleServicesClick}
              >
                {t('navServices')}
              </NavLink>

              <NavLink
                to="/ai-assistant"
                className={({ isActive }) =>
                  `navbar-link ${isActive ? 'active' : ''}`
                }
                onClick={closeMenu}
              >
                {t('navAi')}
              </NavLink>

              <NavLink
                to="/my-documents"
                className={({ isActive }) =>
                  `navbar-link ${isActive ? 'active' : ''}`
                }
                onClick={closeMenu}
              >
                {t('navDocs')}
              </NavLink>

              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `navbar-link ${isActive ? 'active' : ''}`
                }
                onClick={closeMenu}
              >
                {t('navProfile')}
              </NavLink>

              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `navbar-link ${isActive ? 'active' : ''}`
                  }
                  onClick={closeMenu}
                >
                  {t('navAdmin')}
                </NavLink>
              )}

            </div>
          </div>

          {/* RIGHT SECTION: Theme Toggle, Language Selector, User Profile */}
          <div className="navbar-right">
            <div className="navbar-actions">

              {/* Theme Toggle */}
              <button
                type="button"
                className="theme-toggle-button"
                onClick={toggleTheme}
                aria-label={isDark ? t('switchToLight') : t('switchToDark')}
                aria-pressed={isDark}
                title={isDark ? t('switchToLight') : t('switchToDark')}
              >
                <span className={`theme-icon-slot ${!isDark ? 'active' : ''}`} aria-hidden="true">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" />
                    <path d="M12 20v2" />
                    <path d="m4.93 4.93 1.41 1.41" />
                    <path d="m17.66 17.66 1.41 1.41" />
                    <path d="M2 12h2" />
                    <path d="M20 12h2" />
                    <path d="m6.34 17.66-1.41 1.41" />
                    <path d="m19.07 4.93-1.41 1.41" />
                  </svg>
                </span>
                <span className={`theme-icon-slot ${isDark ? 'active' : ''}`} aria-hidden="true">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  </svg>
                </span>
              </button>

              {/* Language Selector */}
              <div className="language-wrapper">
                <span className="language-icon">🌐</span>

                <select
                  className="language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  aria-label={t('selectLangLabel')}
                >
                  <option value="en">English</option>
                  <option value="bn">বাংলা</option>
                </select>
              </div>

              {isAuthenticated ? (
                <Link
                  to="/profile"
                  className="login-button"
                  onClick={closeMenu}
                >
                  {profileLabel}
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="login-button"
                    onClick={closeMenu}
                  >
                    {t('navLogin')}
                  </Link>

                  <Link
                    to="/register"
                    className="register-button"
                    onClick={closeMenu}
                  >
                    {t('navRegister')}
                  </Link>
                </>
              )}

            </div>
          </div>

        </div>

      </div>
    </nav>
  );
}

export default Navbar;
