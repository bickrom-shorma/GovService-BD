import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
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
