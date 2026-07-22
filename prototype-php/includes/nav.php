<div class="topnav">
  <strong>DropshipBuilder</strong>
  <a href="index.php" class="<?= $activePage === 'index' ? 'active' : '' ?>">List builder</a>
  <a href="manage.php" class="<?= $activePage === 'manage' ? 'active' : '' ?>">Manage available models</a>
  <button type="button" id="themeToggle" class="theme-toggle" aria-label="Toggle dark mode">Dark mode</button>
</div>
<script>
(function () {
  var btn = document.getElementById('themeToggle');
  function sync() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.textContent = isDark ? 'Light mode' : 'Dark mode';
  }
  sync();
  btn.addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    sync();
  });
})();
</script>
