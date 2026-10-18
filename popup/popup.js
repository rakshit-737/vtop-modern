/**
 * VTOP Modern - Popup Controller
 * Manages user toggles and synchronizes state across browser tabs.
 */

document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const attendanceToggle = document.getElementById('attendanceToggle');
  const privacyToggle = document.getElementById('privacyToggle');
  const autofocusToggle = document.getElementById('autofocusToggle');

  const DEFAULTS = {
    theme: 'dark',
    attendanceCalc: true,
    cgpaBlur: true,
    autoFocus: true
  };

  // Load current settings
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(DEFAULTS, (settings) => {
      themeToggle.checked = settings.theme === 'dark';
      attendanceToggle.checked = settings.attendanceCalc !== false;
      privacyToggle.checked = settings.cgpaBlur !== false;
      autofocusToggle.checked = settings.autoFocus !== false;
    });
  }

  // Theme Toggle Handler
  themeToggle.addEventListener('change', () => {
    const newTheme = themeToggle.checked ? 'dark' : 'light';
    chrome.storage.sync.set({ theme: newTheme });
  });

  // Attendance Toggle Handler
  attendanceToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ attendanceCalc: attendanceToggle.checked });
  });

  // Privacy Toggle Handler
  privacyToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ cgpaBlur: privacyToggle.checked });
  });

  // Autofocus Toggle Handler
  autofocusToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ autoFocus: autofocusToggle.checked });
  });
});
