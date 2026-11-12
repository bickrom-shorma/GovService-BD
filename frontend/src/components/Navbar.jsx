
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

        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="brand-icon">🏛️</span>
          <span>GovService BD</span>
        </Link>

        <button
          className="navbar-toggle"
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          ☰
        </button>

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
              Home
            </NavLink>

            <NavLink
              to="/"
              className="navbar-link"
              onClick={closeMenu}
            >
              Services
            </NavLink>

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

            <select
              className="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Select language"
            >
              <option value="বাংলা">বাংলা</option>
              <option value="English">English</option>
            </select>

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
