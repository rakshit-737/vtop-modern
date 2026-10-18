/**
 * VTOP Modern - Pre-Login & Authentication Assistant
 * 
 * - Streamlines role selection with an Auth Hub segmented control
 * - Focus management: auto-focuses username -> password -> captcha
 * - Registration number auto-capitalization (e.g., 21bce1234 -> 21BCE1234)
 * - Enter key shortcut to immediately submit role selection
 */

(() => {
  const ICONS = window.VTOP_ICONS || {};

  function setupPreloginHub() {
    const header = document.getElementById('vtopOpenPageHeader');
    if (!header || document.querySelector('.vtop-auth-hub-badge')) return;

    // Subtle header badge
    const badge = document.createElement('div');
    badge.className = 'vtop-auth-hub-badge';
    badge.innerHTML = `
      <span class="vtop-pulse-dot"></span>
      <span>Modern Portal Active</span>
    `;

    const navContainer = header.querySelector('.container-fluid');
    if (navContainer) {
      navContainer.appendChild(badge);
    }

    // Enhance Student Card with clear CTA
    const studentCard = document.querySelector('.cardStudent');
    if (studentCard && !studentCard.querySelector('.vtop-card-cta')) {
      const cta = document.createElement('div');
      cta.className = 'vtop-card-cta';
      cta.innerHTML = `
        <span>Press <kbd>↵</kbd> or Click to Enter</span>
      `;
      studentCard.querySelector('.circle')?.appendChild(cta);
    }

    // Keyboard shortcut: Press Enter to submit Student Login immediately
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
      if (e.key === 'Enter' || e.key === 's' || e.key === 'S') {
        const stdForm = document.getElementById('stdForm');
        if (stdForm) {
          e.preventDefault();
          stdForm.submit();
        }
      }
    });
  }

  function setupLoginModalInputs() {
    const usernameInput = document.querySelector('input[name="uname"], input#uname, input[name="username"]');
    const passwordInput = document.querySelector('input[name="passwd"], input#passwd, input[type="password"]');
    const captchaInput = document.querySelector('input[name="captchaCheck"], input#captchaCheck, input[name="captcha"]');

    if (usernameInput && !usernameInput.dataset.vtopEnhanced) {
      usernameInput.dataset.vtopEnhanced = 'true';

      // Auto-capitalize registration numbers
      usernameInput.addEventListener('input', () => {
        const start = usernameInput.selectionStart;
        const end = usernameInput.selectionEnd;
        usernameInput.value = usernameInput.value.toUpperCase();
        usernameInput.setSelectionRange(start, end);
      });

      // Autofocus
      setTimeout(() => {
        if (!usernameInput.value) {
          usernameInput.focus();
        } else if (passwordInput && !passwordInput.value) {
          passwordInput.focus();
        } else if (captchaInput) {
          captchaInput.focus();
        }
      }, 200);
    }

    // Advance to captcha when Enter is pressed in password field
    if (passwordInput && captchaInput && !passwordInput.dataset.vtopEnhanced) {
      passwordInput.dataset.vtopEnhanced = 'true';
      passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && passwordInput.value && !captchaInput.value) {
          e.preventDefault();
          captchaInput.focus();
        }
      });
    }

    // Clean refresh tooltip for captcha
    const captchaImg = document.getElementById('imgCaptcha') || document.querySelector('img[src*="captcha"]');
    if (captchaImg && !captchaImg.dataset.vtopEnhanced) {
      captchaImg.dataset.vtopEnhanced = 'true';
      captchaImg.setAttribute('title', 'Click to reload captcha');
    }
  }

  function init() {
    setupPreloginHub();
    setupLoginModalInputs();
  }

  const observer = new MutationObserver(init);
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
