/**
 * VTOP Modern - Popup Controller
 * Manages preferences, live academic summary, and theme switching.
 */

document.addEventListener('DOMContentLoaded', () => {
  const themeQuickToggle = document.getElementById('themeQuickToggle');
  const attendanceToggle = document.getElementById('attendanceToggle');
  const privacyToggle = document.getElementById('privacyToggle');
  const autofocusToggle = document.getElementById('autofocusToggle');
  const academicContainer = document.getElementById('academicContainer');

  const DEFAULTS = {
    theme: 'dark',
    attendanceCalc: true,
    cgpaBlur: true,
    autoFocus: true
  };

  // 1. Load User Preferences
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(DEFAULTS, (settings) => {
      applyTheme(settings.theme || 'dark');
      setSwitchState(attendanceToggle, settings.attendanceCalc !== false);
      setSwitchState(privacyToggle, settings.cgpaBlur !== false);
      setSwitchState(autofocusToggle, settings.autoFocus !== false);
    });
  } else {
    applyTheme('dark');
    setSwitchState(attendanceToggle, true);
    setSwitchState(privacyToggle, true);
    setSwitchState(autofocusToggle, true);
  }

  // 2. Load Academic Summary from Local Storage
  loadAcademicSummary();

  function loadAcademicSummary() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['vtop_attendance_summary'], (result) => {
        const data = result.vtop_attendance_summary;
        renderAcademicSummary(data);
      });
    } else {
      renderAcademicSummary(null);
    }
  }

  function renderAcademicSummary(data) {
    if (!academicContainer) return;

    if (!data || !data.percent) {
      academicContainer.innerHTML = `
        <div class="academic-empty">
          <span class="academic-empty-title">No Academic Data Synced</span>
          <span class="academic-empty-desc">Open your VTOP Attendance page to automatically sync real-time analytics.</span>
          <a href="https://vtopcc.vit.ac.in/vtop/open/page" target="_blank" rel="noopener" class="academic-open-link">
            Open VTOP Portal →
          </a>
        </div>
      `;
      return;
    }

    const isSafe = data.status !== 'CRITICAL';
    const badgeClass = isSafe ? 'badge-safe' : 'badge-critical';
    const badgeText = isSafe ? `${data.bunks} Bunks Safe` : `${data.coursesBelow75} Under 75%`;

    const updatedDate = data.updatedAt ? new Date(data.updatedAt) : null;
    const timeString = updatedDate ? updatedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently';

    academicContainer.innerHTML = `
      <div class="academic-card">
        <div class="academic-top">
          <span class="academic-pct">${data.percent}</span>
          <span class="academic-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="academic-details">
          <span>${data.attended} of ${data.conducted} classes attended</span>
          <span style="color: var(--pop-text-muted);">${timeString}</span>
        </div>
      </div>
    `;
  }

  // 3. Switch Handlers
  function setSwitchState(btn, isChecked) {
    if (!btn) return;
    btn.setAttribute('aria-checked', isChecked ? 'true' : 'false');
  }

  function bindSwitch(btn, storageKey) {
    if (!btn) return;
    btn.addEventListener('click', () => {
      const currentState = btn.getAttribute('aria-checked') === 'true';
      const newState = !currentState;
      setSwitchState(btn, newState);

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ [storageKey]: newState });
      }
    });
  }

  bindSwitch(attendanceToggle, 'attendanceCalc');
  bindSwitch(privacyToggle, 'cgpaBlur');
  bindSwitch(autofocusToggle, 'autoFocus');

  // 4. Quick Theme Toggle in Header
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  if (themeQuickToggle) {
    themeQuickToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ theme: next });
      }
    });
  }
});
