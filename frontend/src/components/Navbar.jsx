import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

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

  const handleLogout = () => {
    closeMenu();
    logout();
    navigate('/login');
  };

  return (
    <nav className="main-navbar">
      <div className="navbar-container">

        {/* Brand Logo */}
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="brand-icon">🏛️</span>
          <span className="brand-text">
            {t('brandMain')} <span>{t('brandSub')}</span>
          </span>
        </Link>

        {/* Mobile Menu Button */}
        <button
          className={`navbar-toggle ${menuOpen ? 'open' : ''}`}
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={t('toggleNavLabel')}
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        {/* Navigation Menu */}
        <div className={`navbar-menu ${menuOpen ? 'show' : ''}`}>

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

            {isAuthenticated && (
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `navbar-link ${isActive ? 'active' : ''}`
                }
                onClick={closeMenu}
              >
                {t('navProfile')}
              </NavLink>
            )}

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
              <>
                <Link
                  to="/profile"
                  className="login-button"
                  onClick={closeMenu}
                >
                  {user?.full_name?.split(' ')[0] || t('navProfile')}
                </Link>
                <button
                  type="button"
                  className="register-button"
                  onClick={handleLogout}
                >
                  {t('navLogout')}
                </button>
              </>
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
    </nav>
  );
}

export default Navbar;
