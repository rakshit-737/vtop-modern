/**
 * VTOP Modern - Command Palette (Raycast / Linear style)
 * Shortcuts: Ctrl+K or Cmd+K
 * Provides instant keyboard navigation across all VTOP tabs and actions.
 */

(() => {
  const ICONS = window.VTOP_ICONS || {};

  const COMMANDS = [
    {
      category: 'Academics',
      title: 'Attendance Details',
      subtitle: 'View subject attendance & bunk margins',
      keywords: 'attendance bunk hours present absent classes',
      icon: ICONS.barChart || '',
      action: () => navigateToVtopMenu(['attendance', 'view attendance'])
    },
    {
      category: 'Academics',
      title: 'Class Timetable',
      subtitle: 'View weekly schedule and slot allocations',
      keywords: 'timetable schedule slots classes lectures today monday tuesday',
      icon: ICONS.calendar || '',
      action: () => navigateToVtopMenu(['timetable', 'class timetable'])
    },
    {
      category: 'Academics',
      title: 'Digital Assignments (DA)',
      subtitle: 'Upload and track assignment submissions',
      keywords: 'assignment da digital homework upload due dates',
      icon: ICONS.book || '',
      action: () => navigateToVtopMenu(['digital assignment', 'da upload', 'student da'])
    },
    {
      category: 'Academics',
      title: 'Marks & Grades',
      subtitle: 'Check CAT, FAT, and internal assessments',
      keywords: 'marks grades gpa cgpa internal results cat fat quiz',
      icon: ICONS.barChart || '',
      action: () => navigateToVtopMenu(['marks', 'student marks', 'view marks'])
    },
    {
      category: 'Academics',
      title: 'Exam Schedule',
      subtitle: 'View CAT-1, CAT-2, and FAT exam dates & venues',
      keywords: 'exam cat fat schedule dates hall venue seat',
      icon: ICONS.calendar || '',
      action: () => navigateToVtopMenu(['exam schedule', 'examination schedule', 'view exam'])
    },
    {
      category: 'Extension Settings',
      title: 'Toggle Dark / Light Theme',
      subtitle: 'Switch between Obsidian and Porcelain themes',
      keywords: 'theme dark light mode appearance color',
      icon: ICONS.moon || '',
      action: () => toggleTheme()
    },
    {
      category: 'Extension Settings',
      title: 'Toggle Grade Privacy Shield',
      subtitle: 'Blur or reveal CGPA and marks from onlookers',
      keywords: 'privacy blur shield cgpa marks hide reveal grades',
      icon: ICONS.eyeOff || '',
      action: () => togglePrivacy()
    },
    {
      category: 'System',
      title: 'Refresh Portal',
      subtitle: 'Reload current page safely',
      keywords: 'refresh reload reset page',
      icon: ICONS.refresh || '',
      action: () => window.location.reload()
    }
  ];

  function navigateToVtopMenu(searchTerms) {
    // Attempt to click matching anchor inside sidebar navigation
    const links = Array.from(document.querySelectorAll('a, button, li'));
    for (const term of searchTerms) {
      const match = links.find(el => el.innerText.toLowerCase().trim() === term || el.innerText.toLowerCase().includes(term));
      if (match) {
        match.click();
        return;
      }
    }
    // Fallback: search by href
    for (const term of searchTerms) {
      const hrefMatch = links.find(el => el.href && el.href.toLowerCase().includes(term.replace(/\s+/g, '')));
      if (hrefMatch) {
        hrefMatch.click();
        return;
      }
    }
  }

  function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-vtop-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-vtop-theme', next);
    localStorage.setItem('vtop_theme', next);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ theme: next });
    }
  }

  function togglePrivacy() {
    window.dispatchEvent(new CustomEvent('vtop-cgpa-toggle-request'));
  }

  let paletteEl = null;
  let activeIndex = 0;
  let filteredCommands = [...COMMANDS];

  function openPalette() {
    if (paletteEl) {
      paletteEl.style.display = 'flex';
      const input = paletteEl.querySelector('.vtop-palette-input');
      input.value = '';
      input.focus();
      filterItems('');
      return;
    }

    paletteEl = document.createElement('div');
    paletteEl.id = 'vtop-command-palette-overlay';
    paletteEl.className = 'vtop-palette-overlay';

    paletteEl.innerHTML = `
      <div class="vtop-palette-modal" role="dialog" aria-modal="true" aria-label="Command Menu">
        <div class="vtop-palette-search-bar">
          <span class="vtop-palette-search-icon">${ICONS.search || ''}</span>
          <input type="text" class="vtop-palette-input" placeholder="Search VTOP pages, actions, or shortcuts..." />
          <kbd class="vtop-palette-esc">ESC</kbd>
        </div>
        <div class="vtop-palette-results" role="listbox"></div>
        <div class="vtop-palette-footer">
          <div class="vtop-palette-hint">
            <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Select</span>
            <span><kbd>ESC</kbd> Close</span>
          </div>
          <span class="vtop-palette-brand">VTOP Modern</span>
        </div>
      </div>
    `;

    document.body.appendChild(paletteEl);

    const input = paletteEl.querySelector('.vtop-palette-input');
    const resultsContainer = paletteEl.querySelector('.vtop-palette-results');

    // Close on overlay click
    paletteEl.addEventListener('click', (e) => {
      if (e.target === paletteEl) closePalette();
    });

    // Input search listener
    input.addEventListener('input', (e) => filterItems(e.target.value));

    // Keyboard navigation
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % filteredCommands.length;
        renderResults();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = (activeIndex - 1 + filteredCommands.length) % filteredCommands.length;
        renderResults();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[activeIndex]) {
          const cmd = filteredCommands[activeIndex];
          closePalette();
          cmd.action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closePalette();
      }
    });

    filterItems('');
    input.focus();
  }

  function closePalette() {
    if (paletteEl) {
      paletteEl.style.display = 'none';
    }
  }

  function filterItems(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
      filteredCommands = [...COMMANDS];
    } else {
      filteredCommands = COMMANDS.filter(cmd =>
        cmd.title.toLowerCase().includes(q) ||
        cmd.subtitle.toLowerCase().includes(q) ||
        cmd.keywords.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q)
      );
    }
    activeIndex = 0;
    renderResults();
  }

  function renderResults() {
    if (!paletteEl) return;
    const container = paletteEl.querySelector('.vtop-palette-results');

    if (filteredCommands.length === 0) {
      container.innerHTML = `
        <div class="vtop-palette-empty">
          <span>No matching navigation or commands found</span>
        </div>
      `;
      return;
    }

    let currentCategory = '';
    let html = '';

    filteredCommands.forEach((cmd, idx) => {
      if (cmd.category !== currentCategory) {
        currentCategory = cmd.category;
        html += `<div class="vtop-palette-group-title">${currentCategory}</div>`;
      }

      const isSelected = idx === activeIndex;
      html += `
        <div class="vtop-palette-item ${isSelected ? 'selected' : ''}" data-idx="${idx}" role="option" aria-selected="${isSelected}">
          <span class="vtop-palette-item-icon">${cmd.icon}</span>
          <div class="vtop-palette-item-info">
            <span class="vtop-palette-item-title">${cmd.title}</span>
            <span class="vtop-palette-item-sub">${cmd.subtitle}</span>
          </div>
          <span class="vtop-palette-item-shortcut">${cmd.category === 'Academics' ? 'Jump' : 'Toggle'}</span>
        </div>
      `;
    });

    container.innerHTML = html;

    // Click handler for items
    container.querySelectorAll('.vtop-palette-item').forEach((item) => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.idx, 10);
        if (filteredCommands[idx]) {
          closePalette();
          filteredCommands[idx].action();
        }
      });
    });

    // Auto-scroll selected item into view
    const selectedEl = container.querySelector('.vtop-palette-item.selected');
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }

  // Global Keydown Shortcut Listener
  window.addEventListener('keydown', (e) => {
    // Check for Ctrl+K or Cmd+K
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (paletteEl && paletteEl.style.display !== 'none') {
        closePalette();
      } else {
        openPalette();
      }
    }
  });
})();
