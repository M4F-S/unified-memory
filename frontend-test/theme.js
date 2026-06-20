(function () {
  const html = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const toggleBtn = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  if (!toggleBtn || !themeIcon) return;

  function getStoredTheme() {
    return localStorage.getItem('um-theme');
  }
  function getEffectiveTheme() {
    const stored = getStoredTheme();
    return stored || (prefersDark.matches ? 'dark' : 'light');
  }
  function applyTheme(theme) {
    html.classList.remove('light', 'dark');
    html.classList.add(theme);
    themeIcon.textContent = theme === 'dark' ? '\u2600\ufe0f' : '\ud83c\udf19';
    const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    toggleBtn.setAttribute('aria-label', label);
    toggleBtn.title = label;
  }

  applyTheme(getEffectiveTheme());
  window.addEventListener('load', () => document.body.classList.add('theme-ready'));
  toggleBtn.addEventListener('click', () => {
    const next = html.classList.contains('dark') ? 'light' : 'dark';
    localStorage.setItem('um-theme', next);
    applyTheme(next);
  });
  prefersDark.addEventListener('change', (e) => {
    if (!getStoredTheme()) applyTheme(e.matches ? 'dark' : 'light');
  });
  toggleBtn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    localStorage.removeItem('um-theme');
    applyTheme(prefersDark.matches ? 'dark' : 'light');
  });
})();
