/**
 * VTOP Modern - Login Helper & Enhancements
 * Streamlines the login flow, handles shortcuts, and auto-focuses inputs.
 */

(() => {
  function initLoginEnhancements() {
    // 1. Check if on the pre-login landing page
    const header = document.getElementById('vtopOpenPageHeader');
    if (header && !document.querySelector('.vtop-modern-badge')) {
      const badge = document.createElement('span');
      badge.className = 'vtop-modern-badge';
      badge.innerHTML = `✨ VTOP Modern`;
      const container = header.querySelector('.container-fluid');
      if (container) container.appendChild(badge);

      // Student Card Keyboard Shortcut Hint
      const studentCard = document.querySelector('.cardStudent');
      if (studentCard) {
        const hint = document.createElement('div');
        hint.style.cssText = 'font-size: 0.72rem; color: #94a3b8; margin-top: 4px; font-weight: 500;';
        hint.innerText = '⚡ Press [S] or Click';
        studentCard.querySelector('.circle')?.appendChild(hint);
      }

      // Key listener for quick student login
      document.addEventListener('keydown', (e) => {
        // Only if not focused in an input
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        if (e.key === 's' || e.key === 'S') {
          const stdForm = document.getElementById('stdForm');
          if (stdForm) stdForm.submit();
        }
      });
    }

    // 2. Auto-focus and format student login inputs
    const usernameInput = document.querySelector('input[name="uname"], input#uname, input[name="username"]');
    const passwordInput = document.querySelector('input[name="passwd"], input#passwd, input[type="password"]');
    const captchaInput = document.querySelector('input[name="captchaCheck"], input#captchaCheck, input[name="captcha"]');

    if (usernameInput) {
      // Auto-capitalize registration numbers
      usernameInput.addEventListener('input', (e) => {
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
      }, 250);
    }

    // Auto-advance from password to captcha on enter or tab
    if (passwordInput && captchaInput) {
      passwordInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter' && passwordInput.value && !captchaInput.value) {
          e.preventDefault();
          captchaInput.focus();
        }
      });
    }

    // Make captcha reload cleaner
    const captchaImg = document.getElementById('imgCaptcha') || document.querySelector('img[src*="captcha"]');
    if (captchaImg) {
      captchaImg.style.cursor = 'pointer';
      captchaImg.title = 'Click to reload captcha';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoginEnhancements);
  } else {
    initLoginEnhancements();
  }

  // Observe dynamically loaded modals (VTOP loads student login via AJAX/modal)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        initLoginEnhancements();
        break;
      }
    }
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });
})();
