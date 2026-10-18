/**
 * VTOP Modern - Timetable Matrix Enhancements
 * Highlights current day and active ongoing lecture slot.
 */

(() => {
  const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  function highlightTimetable() {
    const todayIndex = new Date().getDay();
    const todayName = DAYS[todayIndex];

    const tables = document.querySelectorAll('table');
    tables.forEach((table) => {
      const text = table.innerText.toUpperCase();
      if (!text.includes('MON') || !text.includes('THEORY') && !text.includes('LAB')) return;

      const rows = table.querySelectorAll('tr');
      rows.forEach((row) => {
        const firstCellText = row.children[0]?.innerText.toUpperCase().trim() || '';
        if (firstCellText.includes(todayName) || (todayName.startsWith(firstCellText) && firstCellText.length >= 3)) {
          row.classList.add('vtop-today-highlight');
        }
      });
    });
  }

  setInterval(highlightTimetable, 3000);
  document.addEventListener('DOMContentLoaded', highlightTimetable);
})();
