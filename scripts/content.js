/**
 * VTOP Modern - Content Coordinator & General UI Enhancements
 * Adds Floating Dock, CGPA Privacy Blurring, and Session safeguards.
 */

(() => {
  let isCgpaBlurred = true;

  // 1. CGPA & Grade Privacy Blurring
  function setupCgpaPrivacy() {
    const cells = document.querySelectorAll('td, span, div, strong, b');
    cells.forEach((el) => {
      const text = el.innerText.trim();
      // Look for CGPA patterns e.g. "CGPA : 9.45" or a cell right next to CGPA
      if (/^(CGPA|GPA)\s*[:=]?\s*(\d+\.\d+)/i.test(text) || (el.previousElementSibling && /CGPA/i.test(el.previousElementSibling.innerText))) {
        if (!el.classList.contains('vtop-cgpa-blur')) {
          el.classList.add('vtop-cgpa-blur');
          el.title = 'Click to toggle CGPA visibility';
          el.addEventListener('click', () => {
            el.classList.toggle('vtop-cgpa-revealed');
          });
        }
      }
    });
  }

  // 2. Inject Modern Floating Dock
  function injectFloatingDock() {
    if (document.getElementById('vtop-modern-dock')) return;

    const dock = document.createElement('div');
    dock.id = 'vtop-modern-dock';
    dock.className = 'vtop-floating-dock';

    const currentTheme = document.documentElement.getAttribute('data-vtop-theme') || 'dark';

    dock.innerHTML = `
      <button class="vtop-dock-btn" id="vtop-theme-btn" title="Toggle Dark/Light Mode">
        <span id="vtop-theme-icon">${currentTheme === 'dark' ? '🌙' : '☀️'}</span>
        <span id="vtop-theme-label">${currentTheme === 'dark' ? 'Dark' : 'Light'}</span>
      </button>
      <div style="width: 1px; height: 16px; background: var(--vtop-border);"></div>
      <button class="vtop-dock-btn" id="vtop-privacy-btn" title="Toggle Grade Privacy Blur">
        <span>🕶️</span>
        <span>Privacy</span>
      </button>
    `;

    document.body.appendChild(dock);

    // Event Listeners
    const themeBtn = dock.querySelector('#vtop-theme-btn');
    const themeIcon = dock.querySelector('#vtop-theme-icon');
    const themeLabel = dock.querySelector('#vtop-theme-label');

    themeBtn.addEventListener('click', () => {
      const active = document.documentElement.getAttribute('data-vtop-theme') === 'dark';
      const next = active ? 'light' : 'dark';
      document.documentElement.setAttribute('data-vtop-theme', next);
      localStorage.setItem('vtop_theme', next);
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ theme: next });
      }
      themeIcon.innerText = next === 'dark' ? '🌙' : '☀️';
      themeLabel.innerText = next === 'dark' ? 'Dark' : 'Light';
    });

    const privacyBtn = dock.querySelector('#vtop-privacy-btn');
    privacyBtn.addEventListener('click', () => {
      isCgpaBlurred = !isCgpaBlurred;
      privacyBtn.classList.toggle('active', isCgpaBlurred);
      document.querySelectorAll('.vtop-cgpa-blur').forEach((el) => {
        if (isCgpaBlurred) {
          el.classList.remove('vtop-cgpa-revealed');
        } else {
          el.classList.add('vtop-cgpa-revealed');
        }
      });
    });
  }

  // 3. Clean inline background color artifacts from old Bootstrap
  function cleanupLegacyInlineStyles() {
    document.querySelectorAll('[style*="background-color: white"], [style*="background-color: #fff"]').forEach(el => {
      if (document.documentElement.getAttribute('data-vtop-theme') === 'dark') {
        el.style.backgroundColor = 'transparent';
      }
    });
  }

  // Listen for CGPA toggle events from theme manager or popup
  window.addEventListener('vtop-cgpa-toggle', (e) => {
    isCgpaBlurred = e.detail;
    document.querySelectorAll('.vtop-cgpa-blur').forEach((el) => {
      if (isCgpaBlurred) {
        el.classList.remove('vtop-cgpa-revealed');
      } else {
        el.classList.add('vtop-cgpa-revealed');
      }
    });
  });

  function init() {
    setupCgpaPrivacy();
    injectFloatingDock();
    cleanupLegacyInlineStyles();
  }

  setInterval(init, 2500);
  document.addEventListener('DOMContentLoaded', init);
})();
