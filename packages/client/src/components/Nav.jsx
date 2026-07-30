import { useState } from 'react';
import ThemeToggle from './ThemeToggle.jsx';

function Nav({ page }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const rulesActive = page === 'math' || page === 'rulebook';

  function closeAll() {
    setMenuOpen(false);
    setRulesOpen(false);
  }

  return (
    <nav className="topnav">
      <a href="#list" className={page === 'list' ? 'active' : ''}>
        List builder
      </a>
      <a href="#manage" className={page === 'manage' ? 'active' : ''}>
        Configuration
      </a>
      <div className="nav-dropdown">
        <button
          type="button"
          className={`nav-dropdown-trigger ${rulesActive ? 'active' : ''}`}
          aria-expanded={rulesOpen}
          onClick={() => {
            setRulesOpen((open) => !open);
            setMenuOpen(false);
          }}
        >
          Rules
        </button>
        {rulesOpen && (
          <div className="nav-dropdown-menu">
            <a
              href="#math"
              className={page === 'math' ? 'active' : ''}
              onClick={closeAll}
            >
              Math reference
            </a>
            <a
              href="#rulebook"
              className={page === 'rulebook' ? 'active' : ''}
              onClick={closeAll}
            >
              Rule book
            </a>
          </div>
        )}
      </div>
      <div className="nav-dropdown nav-hamburger-wrap">
        <button
          type="button"
          className="hamburger-btn"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => {
            setMenuOpen((open) => !open);
            setRulesOpen(false);
          }}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
        {menuOpen && (
          <div className="nav-dropdown-menu nav-dropdown-menu-right">
            <div className="nav-dropdown-item">
              <ThemeToggle />
            </div>
            <a
              href="https://krayt1x.github.io/DropshipSimulator/"
              target="_blank"
              rel="noreferrer"
              onClick={closeAll}
            >
              Dropship Simulator
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Nav;
