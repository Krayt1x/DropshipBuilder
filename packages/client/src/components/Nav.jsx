import { useState } from 'react';
import ThemeToggle from './ThemeToggle.jsx';

function Nav({ page }) {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="nav-wrapper">
      <nav className="topnav">
        <strong>DropshipBuilder</strong>
        <a href="#list" className={page === 'list' ? 'active' : ''}>
          List builder
        </a>
        <a href="#manage" className={page === 'manage' ? 'active' : ''}>
          Manage available models
        </a>
        <button
          type="button"
          className="hamburger-btn"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
        <ThemeToggle />
      </nav>
      {menuOpen && (
        <div className="mobile-menu">
          <a
            href="#list"
            className={page === 'list' ? 'active' : ''}
            onClick={closeMenu}
          >
            List builder
          </a>
          <a
            href="#manage"
            className={page === 'manage' ? 'active' : ''}
            onClick={closeMenu}
          >
            Manage available models
          </a>
        </div>
      )}
    </div>
  );
}

export default Nav;
