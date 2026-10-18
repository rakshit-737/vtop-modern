/**
 * VTOP Modern - Content Coordinator & Academic Privacy Engine
 * 
 * Responsibilities:
 * - Comprehensive Academic Privacy Shield (CGPA, GPA, Marks, Grades)
 * - Accessible Reveal / Conceal keyboard and click interactions
 * - Minimalist Floating Action Dock with Command Palette trigger
 * - Clean removal of legacy inline styles
 */

(() => {
  const ICONS = window.VTOP_ICONS || {};
  let isPrivacyActive = true;

  // Initialize privacy setting from storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get({ cgpaBlur: true }, (data) => {
      isPrivacyActive = data.cgpaBlur !== false;
      applyPrivacyShield();
    });
  }

  /**
   * Academic Privacy Shield Engine
   * Identifies CGPA/GPA values, Exam Marks, and Grade cells.
   */
  function applyPrivacyShield() {
    // 1. Text-based detection (CGPA: 9.42, GPA: 8.9)
    const elements = document.querySelectorAll('td, span, div, strong, b, h4, h5');
    elements.forEach((el) => {
      // Avoid tagging parents or script tags
      if (el.children.length > 2) return;
      const text = el.innerText.trim();

      const isCgpaPattern = /^(CGPA|GPA)\s*[:=]?\s*(\d+\.?\d*)/i.test(text);
      const isCgpaNeighbor = el.previousElementSibling && /CGPA|GPA|Grade Point/i.test(el.previousElementSibling.innerText);

      if (isCgpaPattern || isCgpaNeighbor) {
        tagShieldedElement(el);
      }
    });

    // 2. Table column detection (Marks Tables, Grade Tables)
    const tables = document.querySelectorAll('table');
    tables.forEach((table) => {
      const headers = Array.from(table.querySelectorAll('th, thead td'));
      const sensitiveIndices = [];

      headers.forEach((th, idx) => {
        const headerText = th.innerText.toLowerCase();
        if (
          headerText.includes('marks') ||
          headerText.includes('grade') ||
          headerText.includes('scored') ||
          headerText.includes('gpa') ||
          headerText.includes('cgpa') ||
          headerText.includes('total mark')
        ) {
          sensitiveIndices.push(idx);
        }
      });

      if (sensitiveIndices.length > 0) {
        const rows = table.querySelectorAll('tbody tr, tr');
        rows.forEach((row) => {
          if (row.querySelector('th')) return;
          const cells = row.querySelectorAll('td');
          sensitiveIndices.forEach((colIdx) => {
            if (cells[colIdx]) {
              tagShieldedElement(cells[colIdx]);
            }
          });
        });
      }
    });
  }

  function tagShieldedElement(el) {
    if (!el.classList.contains('vtop-privacy-shielded')) {
      el.classList.add('vtop-privacy-shielded');
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', 'Academic value shielded for privacy. Click or press Enter to reveal.');

      // Click to reveal
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        el.classList.toggle('revealed');
      });

      // Keyboard reveal
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          el.classList.toggle('revealed');
        }
      });
    }

    if (!isPrivacyActive) {
      el.classList.add('revealed');
    } else {
      el.classList.remove('revealed');
    }
  }

  /**
   * Minimalist Floating Action Dock
   */
  function injectFloatingDock() {
    if (document.getElementById('vtop-action-dock')) return;

    const dock = document.createElement('div');
    dock.id = 'vtop-action-dock';
    dock.className = 'vtop-dock';

    const currentTheme = document.documentElement.getAttribute('data-vtop-theme') || 'dark';

    dock.innerHTML = `
      <button type="button" class="vtop-dock-item" id="vtop-dock-palette" title="Open Command Palette (Ctrl+K)">
        <span class="vtop-dock-icon">${ICONS.search || ''}</span>
        <span class="vtop-dock-kbd">⌘K</span>
      </button>

      <div class="vtop-dock-divider"></div>

      <button type="button" class="vtop-dock-item" id="vtop-dock-privacy" title="Toggle Academic Privacy Shield" aria-pressed="${isPrivacyActive}">
        <span class="vtop-dock-icon" id="vtop-privacy-icon">${isPrivacyActive ? (ICONS.eyeOff || '') : (ICONS.eye || '')}</span>
      </button>

      <button type="button" class="vtop-dock-item" id="vtop-dock-theme" title="Toggle Dark/Light Mode">
        <span class="vtop-dock-icon" id="vtop-theme-icon">${currentTheme === 'dark' ? (ICONS.moon || '') : (ICONS.sun || '')}</span>
      </button>
    `;

    document.body.appendChild(dock);

    // Dock Events
    const paletteBtn = dock.querySelector('#vtop-dock-palette');
    paletteBtn.addEventListener('click', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });

    const privacyBtn = dock.querySelector('#vtop-dock-privacy');
    const privacyIcon = dock.querySelector('#vtop-privacy-icon');
    privacyBtn.addEventListener('click', () => {
      isPrivacyActive = !isPrivacyActive;
      privacyBtn.setAttribute('aria-pressed', isPrivacyActive);
      privacyIcon.innerHTML = isPrivacyActive ? (ICONS.eyeOff || '') : (ICONS.eye || '');
      applyPrivacyShield();

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ cgpaBlur: isPrivacyActive });
      }
    });

    const themeBtn = dock.querySelector('#vtop-dock-theme');
    const themeIcon = dock.querySelector('#vtop-theme-icon');
    themeBtn.addEventListener('click', () => {
      const active = document.documentElement.getAttribute('data-vtop-theme') === 'dark';
      const next = active ? 'light' : 'dark';
      document.documentElement.setAttribute('data-vtop-theme', next);
      localStorage.setItem('vtop_theme', next);
      themeIcon.innerHTML = next === 'dark' ? (ICONS.moon || '') : (ICONS.sun || '');

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ theme: next });
      }
    });
  }

  // Listen for external toggle from Command Palette or Popup
  window.addEventListener('vtop-cgpa-toggle-request', () => {
    isPrivacyActive = !isPrivacyActive;
    const privacyBtn = document.querySelector('#vtop-dock-privacy');
    const privacyIcon = document.querySelector('#vtop-privacy-icon');
    if (privacyBtn) privacyBtn.setAttribute('aria-pressed', isPrivacyActive);
    if (privacyIcon) privacyIcon.innerHTML = isPrivacyActive ? (ICONS.eyeOff || '') : (ICONS.eye || '');
    applyPrivacyShield();

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ cgpaBlur: isPrivacyActive });
    }
  });

  // Debounced DOM Scanner
  let timer = null;
  function runScanners() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      applyPrivacyShield();
      injectFloatingDock();
    }, 250);
  }

  const observer = new MutationObserver(runScanners);
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runScanners);
  } else {
    runScanners();
  }
})();
