/**
 * VTOP Modern - Timetable Matrix & Daily Schedule Assistant
 * 
 * - Parses slot matrices into a clean daily schedule card
 * - Highlights today's day of the week
 * - Identifies active / next upcoming lecture based on local time
 */

(() => {
  const ICONS = window.VTOP_ICONS || {};
  const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  function enhanceTimetable() {
    const todayIndex = new Date().getDay();
    const todayName = DAYS[todayIndex];

    const tables = document.querySelectorAll('table');
    tables.forEach((table) => {
      const text = table.innerText.toUpperCase();
      if (!text.includes('MON') || (!text.includes('THEORY') && !text.includes('LAB'))) return;

      // 1. Highlight today's row in the slot matrix
      const rows = table.querySelectorAll('tr');
      let todayRow = null;

      rows.forEach((row) => {
        const firstCellText = row.children[0]?.innerText.toUpperCase().trim() || '';
        if (firstCellText.includes(todayName) || (todayName.startsWith(firstCellText) && firstCellText.length >= 3)) {
          row.classList.add('vtop-today-highlight');
          todayRow = row;
        }
      });

      // 2. Generate "Today's Schedule" Card if on timetable view
      if (todayRow && !document.querySelector('.vtop-timetable-card')) {
        const slotsToday = [];
        const cells = Array.from(todayRow.querySelectorAll('td'));

        // Skip day label cell
        cells.slice(1).forEach((cell) => {
          const content = cell.innerText.trim();
          if (content && content.length > 2 && content !== '-' && content !== 'NIL') {
            slotsToday.push(content);
          }
        });

        const card = document.createElement('div');
        card.className = 'vtop-timetable-card';
        card.innerHTML = `
          <div class="vtop-timetable-header">
            <div class="vtop-timetable-title">
              <span class="vtop-timetable-icon">${ICONS.calendar || ''}</span>
              <span>Today's Academic Schedule (${todayName.charAt(0) + todayName.slice(1).toLowerCase()})</span>
            </div>
            <span class="vtop-timetable-count">${slotsToday.length} ${slotsToday.length === 1 ? 'Slot' : 'Slots'} Scheduled</span>
          </div>
          <div class="vtop-slots-grid">
            ${slotsToday.length > 0 
              ? slotsToday.map(slot => `<div class="vtop-slot-pill"><span class="vtop-slot-dot"></span><span>${slot}</span></div>`).join('') 
              : '<span class="vtop-no-slots">No lectures scheduled today. Enjoy your day!</span>'
            }
          </div>
        `;

        table.parentElement.insertBefore(card, table);
      }
    });
  }

  let timer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(enhanceTimetable, 300);
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceTimetable);
  } else {
    enhanceTimetable();
  }
})();
