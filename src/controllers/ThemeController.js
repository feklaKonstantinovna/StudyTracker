export function applyTheme(light) {
  document.body.classList.toggle('light', light);
  document.getElementById('themeBtn').textContent = light ? '☀️ Светлая тема' : '🌙 Тёмная тема';
}
export function toggleTheme() {
  const light = !document.body.classList.contains('light');
  localStorage.setItem('sf_theme', light ? 'light' : 'dark');
  applyTheme(light);
}
