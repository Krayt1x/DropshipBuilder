import ThemeToggle from './ThemeToggle.jsx';

function Nav({ page }) {
  return (
    <nav className="topnav">
      <strong>DropshipBuilder</strong>
      <a href="#list" className={page === 'list' ? 'active' : ''}>
        List builder
      </a>
      <a href="#manage" className={page === 'manage' ? 'active' : ''}>
        Manage available models
      </a>
      <ThemeToggle />
    </nav>
  );
}

export default Nav;
