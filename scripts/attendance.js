/**
 * VTOP Modern - Smart Attendance Calculator & Visualizer
 * Analyzes attendance data and computes real-time bunk/attend quotas.
 */

(() => {
  function processAttendanceTables() {
    const tables = document.querySelectorAll('table');

    tables.forEach((table) => {
      if (table.dataset.vtopProcessed === 'true') return;

      const thead = table.querySelector('thead') || table.querySelector('tr');
      if (!thead) return;

      const headerCells = Array.from(thead.querySelectorAll('th, td'));
      let attendedIdx = -1;
      let conductedIdx = -1;
      let percentIdx = -1;

      headerCells.forEach((th, idx) => {
        const text = th.innerText.toLowerCase().trim();
        if (text.includes('attended') && !text.includes('percent') && !text.includes('%')) {
          attendedIdx = idx;
        } else if ((text.includes('conducted') || text.includes('total classes') || text.includes('total hours')) && !text.includes('percent')) {
          conductedIdx = idx;
        } else if (text.includes('percent') || text.includes('%') || text.includes('attendance %')) {
          percentIdx = idx;
        }
      });

      // Confirm this is an attendance table
      if (attendedIdx === -1 || conductedIdx === -1) return;

      table.dataset.vtopProcessed = 'true';

      // Insert extra header for Bunk Quota
      const headerRow = thead.tagName.toLowerCase() === 'tr' ? thead : thead.querySelector('tr');
      if (headerRow) {
        const newTh = document.createElement('th');
        newTh.innerText = 'Smart Bunk / Attend Quota';
        newTh.style.cssText = 'color: #38bdf8 !important; font-weight: 700;';
        headerRow.appendChild(newTh);
      }

      const rows = Array.from(table.querySelectorAll('tbody tr')).filter(r => r.querySelectorAll('td').length > 3);

      let totalAttended = 0;
      let totalConducted = 0;
      let coursesBelow75 = 0;
      let validCourseCount = 0;

      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (!cells || cells.length <= Math.max(attendedIdx, conductedIdx)) return;

        const attendedText = cells[attendedIdx].innerText.replace(/[^0-9]/g, '');
        const conductedText = cells[conductedIdx].innerText.replace(/[^0-9]/g, '');

        const attended = parseInt(attendedText, 10);
        const conducted = parseInt(conductedText, 10);

        if (isNaN(attended) || isNaN(conducted) || conducted === 0) {
          // If no classes yet
          const emptyTd = document.createElement('td');
          emptyTd.innerHTML = `<span class="vtop-bunk-pill" style="color: var(--vtop-text-muted);">N/A</span>`;
          row.appendChild(emptyTd);
          return;
        }

        validCourseCount++;
        totalAttended += attended;
        totalConducted += conducted;

        const currentPct = (attended / conducted) * 100;
        let pillHtml = '';
        let statusClass = 'safe';

        if (currentPct >= 75) {
          // Formula: floor((attended - 0.75 * conducted) / 0.75)
          const bunks = Math.floor((attended - (0.75 * conducted)) / 0.75);
          if (bunks > 0) {
            statusClass = currentPct >= 85 ? 'safe' : 'caution';
            pillHtml = `<span class="vtop-bunk-pill can-bunk">✨ Can bunk ${bunks} ${bunks === 1 ? 'class' : 'classes'}</span>`;
          } else {
            statusClass = 'caution';
            pillHtml = `<span class="vtop-bunk-pill on-edge">⚠️ On Edge (0 bunks left)</span>`;
          }
        } else {
          coursesBelow75++;
          statusClass = 'danger';
          // Formula: ceil((0.75 * conducted - attended) / 0.25)
          const mustAttend = Math.ceil(((0.75 * conducted) - attended) / 0.25);
          pillHtml = `<span class="vtop-bunk-pill must-attend">🚨 Attend next ${mustAttend} ${mustAttend === 1 ? 'class' : 'classes'}</span>`;
        }

        // Add visual percentage bar inside percentage column if present
        if (percentIdx !== -1 && cells[percentIdx]) {
          const pctVal = currentPct.toFixed(1);
          cells[percentIdx].innerHTML = `
            <div style="font-weight: 700; font-family: var(--vtop-font-mono);">${pctVal}%</div>
            <div class="vtop-progress-container">
              <div class="vtop-progress-fill ${statusClass}" style="width: ${Math.min(100, Math.max(5, currentPct))}%"></div>
            </div>
          `;
        }

        // Append the new Smart Status cell
        const newTd = document.createElement('td');
        newTd.innerHTML = pillHtml;
        row.appendChild(newTd);
      });

      // Inject Overall Attendance Dashboard Card if valid courses exist
      if (validCourseCount > 0 && totalConducted > 0 && !document.querySelector('.vtop-attendance-summary-card')) {
        const overallPct = ((totalAttended / totalConducted) * 100).toFixed(1);
        const overallClass = overallPct >= 80 ? 'safe' : (overallPct >= 75 ? 'caution' : 'danger');

        const summaryCard = document.createElement('div');
        summaryCard.className = 'vtop-attendance-summary-card';
        summaryCard.innerHTML = `
          <div class="vtop-summary-metric">
            <span class="vtop-metric-label">Aggregate Attendance</span>
            <span class="vtop-metric-value ${overallClass}">${overallPct}%</span>
          </div>
          <div class="vtop-summary-metric">
            <span class="vtop-metric-label">Classes Attended / Conducted</span>
            <span class="vtop-metric-value">${totalAttended} <span style="font-size: 1.1rem; color: var(--vtop-text-muted);">/ ${totalConducted}</span></span>
          </div>
          <div class="vtop-summary-metric">
            <span class="vtop-metric-label">Subjects Below 75%</span>
            <span class="vtop-metric-value ${coursesBelow75 > 0 ? 'danger' : 'safe'}">${coursesBelow75}</span>
          </div>
          <div class="vtop-summary-metric">
            <span class="vtop-metric-label">Attendance Standing</span>
            <span class="vtop-metric-value ${overallClass}">${overallPct >= 75 ? 'ELIGIBLE' : 'DEBARRED RISK'}</span>
          </div>
        `;

        table.parentElement.insertBefore(summaryCard, table);
      }
    });
  }

  // Periodic and Mutation-based runner to handle AJAX page loads
  setInterval(processAttendanceTables, 1500);
  document.addEventListener('DOMContentLoaded', processAttendanceTables);
})();
