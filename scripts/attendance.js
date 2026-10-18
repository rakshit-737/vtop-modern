/**
 * VTOP Modern - Smart Attendance Calculator & Academic Planner
 * 
 * Features:
 * - Exact integer formulas for 75% threshold (0 floating-point rounding errors)
 * - Safe bunk allowance & recovery quota computation
 * - Interactive What-If Simulator per subject
 * - Caches aggregate stats to chrome.storage.local for popup overview
 * - Restrained, accessible status badges with Feather/Lucide vector icons
 */

(() => {
  const ICONS = window.VTOP_ICONS || {};

  /**
   * Exact integer math for 75% attendance threshold:
   * Condition for >= 75%: A / (C + b) >= 0.75  =>  4A >= 3C + 3b  =>  3b <= 4A - 3C
   *   bunks = floor((4A - 3C) / 3)
   * 
   * Condition for recovery to 75%: (A + r) / (C + r) >= 0.75  =>  4A + 4r >= 3C + 3r  =>  r >= 3C - 4A
   *   recovery = max(0, 3C - 4A)
   */
  function calculateMetrics(attended, conducted) {
    if (isNaN(attended) || isNaN(conducted) || conducted <= 0) {
      return { status: 'NO_DATA', percent: 0, bunks: 0, recovery: 0, formattedPct: '0.0%' };
    }

    const percent = (attended / conducted) * 100;
    const formattedPct = percent.toFixed(1) + '%';

    let bunks = 0;
    if (4 * attended >= 3 * conducted) {
      bunks = Math.floor((4 * attended - 3 * conducted) / 3);
    }

    let recovery = 0;
    if (percent < 75) {
      recovery = Math.max(0, 3 * conducted - 4 * attended);
    }

    let status = 'SAFE';
    if (percent < 75) {
      status = 'CRITICAL';
    } else if (bunks === 0) {
      status = 'ON_EDGE';
    } else if (percent < 80) {
      status = 'CAUTION';
    }

    return { percent, formattedPct, bunks, recovery, status };
  }

  function createStatusPill(metrics, rowId, attended, conducted) {
    const pill = document.createElement('div');
    pill.className = `vtop-quota-chip vtop-quota-${metrics.status.toLowerCase()}`;
    pill.dataset.rowId = rowId;
    pill.dataset.attended = attended;
    pill.dataset.conducted = conducted;

    let iconSvg = ICONS.check || '';
    let text = '';

    switch (metrics.status) {
      case 'SAFE':
        iconSvg = ICONS.check || '';
        text = `${metrics.bunks} ${metrics.bunks === 1 ? 'bunk' : 'bunks'} safe`;
        break;
      case 'CAUTION':
        iconSvg = ICONS.alertTriangle || '';
        text = `${metrics.bunks} ${metrics.bunks === 1 ? 'bunk' : 'bunks'} remaining`;
        break;
      case 'ON_EDGE':
        iconSvg = ICONS.alertTriangle || '';
        text = `0 bunks left (75% margin)`;
        break;
      case 'CRITICAL':
        iconSvg = ICONS.alertCircle || '';
        text = `Attend next ${metrics.recovery} consecutively`;
        break;
      default:
        text = 'No data';
    }

    pill.innerHTML = `
      <span class="vtop-quota-icon">${iconSvg}</span>
      <span class="vtop-quota-text">${text}</span>
      <button type="button" class="vtop-sim-btn" title="Simulate attendance impact" aria-label="Simulate">
        ±
      </button>
    `;

    // Interactive Quick Simulator Trigger
    const simBtn = pill.querySelector('.vtop-sim-btn');
    simBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openRowSimulator(pill, attended, conducted);
    });

    return pill;
  }

  function openRowSimulator(pillContainer, baseAttended, baseConducted) {
    const existing = pillContainer.parentElement.querySelector('.vtop-sim-drawer');
    if (existing) {
      existing.remove();
      return;
    }

    const drawer = document.createElement('div');
    drawer.className = 'vtop-sim-drawer';
    drawer.innerHTML = `
      <div class="vtop-sim-header">
        <span>What-If Simulator</span>
        <button type="button" class="vtop-sim-close" aria-label="Close">✕</button>
      </div>
      <div class="vtop-sim-controls">
        <label>Miss next: <input type="number" min="0" max="20" value="1" class="vtop-sim-miss" /></label>
        <label>Attend next: <input type="number" min="0" max="20" value="0" class="vtop-sim-attend" /></label>
      </div>
      <div class="vtop-sim-result"></div>
    `;

    const missInput = drawer.querySelector('.vtop-sim-miss');
    const attendInput = drawer.querySelector('.vtop-sim-attend');
    const resultDiv = drawer.querySelector('.vtop-sim-result');
    const closeBtn = drawer.querySelector('.vtop-sim-close');

    closeBtn.addEventListener('click', () => drawer.remove());

    function updateSimulation() {
      const miss = Math.max(0, parseInt(missInput.value, 10) || 0);
      const attend = Math.max(0, parseInt(attendInput.value, 10) || 0);

      const simAttended = baseAttended + attend;
      const simConducted = baseConducted + miss + attend;
      const simMetrics = calculateMetrics(simAttended, simConducted);

      resultDiv.innerHTML = `
        Result: <strong>${simMetrics.formattedPct}</strong> (${simAttended}/${simConducted})
        <div style="font-size: 0.72rem; color: var(--vtop-text-muted); margin-top: 2px;">
          ${simMetrics.status === 'CRITICAL' ? `🚨 Debarred risk (-${simMetrics.recovery} needed)` : `✓ Stays safe (${simMetrics.bunks} bunks left)`}
        </div>
      `;
    }

    missInput.addEventListener('input', updateSimulation);
    attendInput.addEventListener('input', updateSimulation);
    updateSimulation();

    pillContainer.parentElement.appendChild(drawer);
  }

  function scanAndProcessTables() {
    const tables = document.querySelectorAll('table');

    tables.forEach((table, tableIndex) => {
      if (table.dataset.vtopModernProcessed === 'true') return;

      // Identify header row
      const thead = table.querySelector('thead') || table.querySelector('tr');
      if (!thead) return;

      const headerCells = Array.from(thead.querySelectorAll('th, td'));
      let attendedIdx = -1;
      let conductedIdx = -1;
      let percentIdx = -1;

      headerCells.forEach((cell, idx) => {
        const text = cell.innerText.toLowerCase().replace(/\s+/g, ' ').trim();
        if ((text.includes('attended') || text.includes('attended hours') || text.includes('attended classes')) && !text.includes('%') && !text.includes('percent')) {
          attendedIdx = idx;
        } else if ((text.includes('conducted') || text.includes('total hours') || text.includes('total classes')) && !text.includes('%')) {
          conductedIdx = idx;
        } else if (text.includes('attendance %') || text.includes('attendance percent') || text.includes('percentage') || text === '%') {
          percentIdx = idx;
        }
      });

      if (attendedIdx === -1 || conductedIdx === -1) return;

      // Mark processed to prevent duplicate columns
      table.dataset.vtopModernProcessed = 'true';
      table.classList.add('vtop-enhanced-table');

      // Append column header
      const headerRow = thead.tagName.toLowerCase() === 'tr' ? thead : thead.querySelector('tr');
      if (headerRow) {
        const newTh = document.createElement('th');
        newTh.className = 'vtop-col-quota';
        newTh.innerText = '75% Threshold Quota';
        headerRow.appendChild(newTh);
      }

      // Process Body Rows
      const rows = Array.from(table.querySelectorAll('tr')).filter((row) => {
        // Exclude header row and nested sub-tables
        if (row.closest('thead')) return false;
        if (row.querySelector('th')) return false;
        return row.querySelectorAll('td').length >= Math.max(attendedIdx, conductedIdx) + 1;
      });

      let totalAttended = 0;
      let totalConducted = 0;
      let coursesCount = 0;
      let coursesBelow75 = 0;
      let totalBunksAvailable = 0;

      rows.forEach((row, rIdx) => {
        const cells = row.querySelectorAll('td');
        const attendedRaw = cells[attendedIdx]?.innerText?.replace(/[^0-9]/g, '') || '';
        const conductedRaw = cells[conductedIdx]?.innerText?.replace(/[^0-9]/g, '') || '';

        const attended = parseInt(attendedRaw, 10);
        const conducted = parseInt(conductedRaw, 10);

        const newTd = document.createElement('td');
        newTd.className = 'vtop-cell-quota';

        if (isNaN(attended) || isNaN(conducted) || conducted === 0) {
          newTd.innerHTML = `<span class="vtop-quota-chip vtop-quota-nodata">No data</span>`;
          row.appendChild(newTd);
          return;
        }

        coursesCount++;
        totalAttended += attended;
        totalConducted += conducted;

        const metrics = calculateMetrics(attended, conducted);
        if (metrics.status === 'CRITICAL') coursesBelow75++;
        totalBunksAvailable += metrics.bunks;

        // Visual inline percentage bar
        if (percentIdx !== -1 && cells[percentIdx]) {
          const originalText = metrics.formattedPct;
          cells[percentIdx].innerHTML = `
            <div class="vtop-percent-display">
              <span class="vtop-percent-text tnum">${originalText}</span>
              <div class="vtop-percent-track" aria-hidden="true">
                <div class="vtop-percent-bar vtop-bar-${metrics.status.toLowerCase()}" style="width: ${Math.min(100, Math.max(4, metrics.percent))}%"></div>
              </div>
            </div>
          `;
        }

        // Add quota chip
        const pill = createStatusPill(metrics, `t${tableIndex}-r${rIdx}`, attended, conducted);
        newTd.appendChild(pill);
        row.appendChild(newTd);
      });

      // Overall Academic Summary Card
      if (coursesCount > 0 && totalConducted > 0 && !document.querySelector('.vtop-overview-card')) {
        const overallMetrics = calculateMetrics(totalAttended, totalConducted);

        const summaryCard = document.createElement('div');
        summaryCard.className = 'vtop-overview-card';
        summaryCard.innerHTML = `
          <div class="vtop-overview-header">
            <div class="vtop-overview-title">
              <span class="vtop-overview-icon">${ICONS.barChart || ''}</span>
              <span>Semester Attendance Overview</span>
            </div>
            <div class="vtop-overview-status vtop-status-${overallMetrics.status.toLowerCase()}">
              ${overallMetrics.status === 'CRITICAL' ? 'Debarment Risk' : 'Eligible for Exams'}
            </div>
          </div>

          <div class="vtop-metrics-grid">
            <div class="vtop-metric-tile">
              <span class="vtop-metric-name">Aggregate Attendance</span>
              <span class="vtop-metric-val tnum vtop-text-${overallMetrics.status.toLowerCase()}">${overallMetrics.formattedPct}</span>
              <span class="vtop-metric-hint">${totalAttended} of ${totalConducted} hours attended</span>
            </div>

            <div class="vtop-metric-tile">
              <span class="vtop-metric-name">Subjects Below 75%</span>
              <span class="vtop-metric-val tnum ${coursesBelow75 > 0 ? 'vtop-text-critical' : 'vtop-text-safe'}">${coursesBelow75}</span>
              <span class="vtop-metric-hint">of ${coursesCount} registered courses</span>
            </div>

            <div class="vtop-metric-tile">
              <span class="vtop-metric-name">Missable Classes Buffer</span>
              <span class="vtop-metric-val tnum">${overallMetrics.bunks}</span>
              <span class="vtop-metric-hint">overall margin before 75%</span>
            </div>

            <div class="vtop-metric-tile">
              <span class="vtop-metric-name">Total Safe Bunks Pool</span>
              <span class="vtop-metric-val tnum">${totalBunksAvailable}</span>
              <span class="vtop-metric-hint">sum across eligible courses</span>
            </div>
          </div>
        `;

        table.parentElement.insertBefore(summaryCard, table);

        // Cache summary in chrome.storage.local for popup access
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({
            vtop_attendance_summary: {
              percent: overallMetrics.formattedPct,
              attended: totalAttended,
              conducted: totalConducted,
              coursesBelow75: coursesBelow75,
              totalCourses: coursesCount,
              bunks: overallMetrics.bunks,
              status: overallMetrics.status,
              updatedAt: new Date().toISOString()
            }
          });
        }
      }
    });
  }

  // Debounced observer for seamless AJAX table updates
  let debounceTimer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(scanAndProcessTables, 200);
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanAndProcessTables);
  } else {
    scanAndProcessTables();
  }
})();
