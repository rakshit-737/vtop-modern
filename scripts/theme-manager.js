/**
 * VTOP Modern - Theme & Preferences Manager
 * Applies user preferences instantly at document_start to eliminate flickering.
 */

(() => {
  const DEFAULT_SETTINGS = {
    theme: 'dark',
    attendanceCalc: true,
    cgpaBlur: true,
    autoFocus: true,
    timetableHighlight: true
  };

  // Immediate synchronous theme application
  const savedTheme = localStorage.getItem('vtop_theme') || DEFAULT_SETTINGS.theme;
  document.documentElement.setAttribute('data-vtop-theme', savedTheme);

  // Sync with chrome.storage if available
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
      if (settings.theme) {
        document.documentElement.setAttribute('data-vtop-theme', settings.theme);
        localStorage.setItem('vtop_theme', settings.theme);
      }
    });

    // Listen for live changes from popup
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync') {
        if (changes.theme) {
          const newTheme = changes.theme.newValue;
          document.documentElement.setAttribute('data-vtop-theme', newTheme);
          localStorage.setItem('vtop_theme', newTheme);
        }
        if (changes.cgpaBlur) {
          window.dispatchEvent(new CustomEvent('vtop-cgpa-toggle', { detail: changes.cgpaBlur.newValue }));
        }
      }
    });
  }
})();
