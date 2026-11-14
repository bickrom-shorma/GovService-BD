
import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState('English');

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="main-navbar">
      <div className="navbar-container">

        {/* Brand Logo */}
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="brand-icon">🏛️</span>
          <span className="brand-text">
            GovService <span>BD</span>
          </span>
        </Link>

        {/* Mobile Menu Button */}
        <button
          className={`navbar-toggle ${menuOpen ? 'open' : ''}`}
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        {/* Navigation Menu */}
        <div className={`navbar-menu ${menuOpen ? 'show' : ''}`}>

          <div className="navbar-links">

            {/* Home */}
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `navbar-link ${isActive ? 'active' : ''}`
              }
              onClick={closeMenu}
            >
              Home
            </NavLink>

            {/* Services */}
            <NavLink
              to="/"
              end
              className="navbar-link"
              onClick={closeMenu}
            >
              Services
            </NavLink>

            {/* AI Assistant */}
            <NavLink
              to="/ai-assistant"
              className={({ isActive }) =>
                `navbar-link ${isActive ? 'active' : ''}`
              }
              onClick={closeMenu}
            >
              AI Assistant
            </NavLink>

            {/* My Documents */}
            <NavLink
              to="/my-documents"
              className={({ isActive }) =>
                `navbar-link ${isActive ? 'active' : ''}`
              }
              onClick={closeMenu}
            >
              My Documents
            </NavLink>

          </div>

          <div className="navbar-actions">

            {/* Language Selector */}
            <div className="language-wrapper">
              <span className="language-icon">🌐</span>

              <select
                className="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                aria-label="Select language"
              >
                <option value="English">English</option>
                <option value="বাংলা">বাংলা</option>
              </select>
            </div>

            {/* Authentication Buttons */}
            <Link
              to="/login"
              className="login-button"
              onClick={closeMenu}
            >
              Login
            </Link>

            <Link
              to="/register"
              className="register-button"
              onClick={closeMenu}
            >
              Register
            </Link>

          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
