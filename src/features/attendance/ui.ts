import { addStyles, appendText, createShadowMount } from '../../core/dom/shadow';
import { calculateWhatIf } from './domain';
import type { AttendanceMetrics, AttendanceSummary } from '../../types/domain';

const UI_STYLE = `
:host { display: inline-block; vertical-align: middle; }
.chip, .summary { font: 500 12px/1.35 system-ui, sans-serif; color: CanvasText; }
.chip { display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border:1px solid color-mix(in srgb, CanvasText 16%, transparent); border-radius:7px; background:Canvas; white-space:nowrap; }
.safe { color:#087443; } .caution, .edge { color:#8a5a00; } .critical { color:#a3152d; } .nodata { color:GrayText; }
button { font:inherit; cursor:pointer; } .sim { margin-left:4px; padding:1px 5px; border:1px solid currentColor; border-radius:4px; background:transparent; color:inherit; }
.drawer { display:grid; gap:8px; min-width:230px; padding:10px; margin-top:6px; border:1px solid color-mix(in srgb, CanvasText 20%, transparent); border-radius:8px; background:Canvas; box-shadow:0 8px 24px color-mix(in srgb, CanvasText 15%, transparent); }
label { display:flex; justify-content:space-between; gap:8px; } input { width:54px; }
.summary { display:block; margin:12px 0; padding:14px; border:1px solid color-mix(in srgb, CanvasText 18%, transparent); border-radius:10px; background:Canvas; box-shadow:0 4px 18px color-mix(in srgb, CanvasText 10%, transparent); }
.summary h2 { margin:0 0 8px; font:600 14px system-ui,sans-serif; } .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:8px; }
.metric { padding:8px; border:1px solid color-mix(in srgb, CanvasText 12%, transparent); border-radius:7px; } .label { display:block; color:GrayText; font-size:11px; } .value { display:block; margin-top:3px; font:650 17px ui-monospace,monospace; }
@media (prefers-reduced-motion: reduce) { * { transition:none !important; } }
`;

function metricLabel(metrics: AttendanceMetrics): string {
  switch (metrics.status) {
    case 'CRITICAL':
      return `Attend ${metrics.recoveryTarget} more`;
    case 'ON_EDGE':
      return '0 safe absences';
    case 'CAUTION':
    case 'SAFE':
      return `${metrics.safeAbsences} safe absence${metrics.safeAbsences === 1 ? '' : 's'}`;
    default:
      return 'No data';
  }
}

export function createQuotaElement(
  metrics: AttendanceMetrics,
  attended: number,
  conducted: number,
): HTMLElement {
  const mount = createShadowMount<HTMLElement>('vtop-attendance-quota', 'vtop-modern-quota');
  const shadow = mount.shadowRoot as ShadowRoot;
  addStyles(shadow, UI_STYLE);
  const wrapper = document.createElement('span');
  wrapper.className = `chip ${metrics.status.toLowerCase()}`;
  appendText(
    wrapper,
    'span',
    metrics.valid ? `${metrics.formattedPercent} · ${metricLabel(metrics)}` : 'No data',
  );
  if (metrics.valid) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sim';
    button.textContent = '±';
    button.title = 'Open what-if attendance simulator';
    button.setAttribute('aria-label', 'Open what-if attendance simulator');
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const existing = shadow.querySelector('.drawer');
      if (existing) {
        existing.remove();
        return;
      }
      const drawer = document.createElement('div');
      drawer.className = 'drawer';
      appendText(drawer, 'strong', 'What-if simulator');
      const absentLabel = document.createElement('label');
      absentLabel.append('Miss next ', createNumberInput('0', 'Miss next classes'));
      const attendLabel = document.createElement('label');
      attendLabel.append('Attend next ', createNumberInput('0', 'Attend next classes'));
      drawer.append(absentLabel, attendLabel);
      const result = appendText(drawer, 'div', '');
      const update = (): void => {
        const absenceInput = absentLabel.querySelector('input');
        const attendanceInput = attendLabel.querySelector('input');
        const absence = Math.max(0, Number(absenceInput?.value ?? 0) || 0);
        const attendance = Math.max(0, Number(attendanceInput?.value ?? 0) || 0);
        const simulated = calculateWhatIf(attended, conducted, absence, attendance, metrics.unit);
        result.textContent = simulated.valid
          ? `${simulated.formattedPercent} · ${metricLabel(simulated)}`
          : 'Enter valid whole-number units.';
      };
      drawer.querySelectorAll('input').forEach((input) => input.addEventListener('input', update));
      update();
      shadow.append(drawer);
    });
    wrapper.append(button);
  }
  shadow.append(wrapper);
  return mount;
}

function createNumberInput(value: string, label: string): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.step = '1';
  input.value = value;
  input.setAttribute('aria-label', label);
  return input;
}

export function createSummaryElement(summary: AttendanceSummary): HTMLElement {
  const mount = createShadowMount<HTMLElement>(
    'vtop-attendance-summary',
    'vtop-modern-attendance-summary',
  );
  const shadow = mount.shadowRoot as ShadowRoot;
  addStyles(shadow, UI_STYLE);
  const wrapper = document.createElement('section');
  wrapper.className = 'summary';
  wrapper.setAttribute('aria-label', 'Attendance overview');
  appendText(wrapper, 'h2', 'Attendance overview');
  const grid = document.createElement('div');
  grid.className = 'grid';
  const entries: Array<[string, string]> = [
    ['Aggregate', summary.formattedPercent],
    ['Attended', `${summary.attended}/${summary.conducted}`],
    ['Safe absences', String(summary.safeAbsences)],
    ['Below 75%', String(summary.coursesBelow75)],
  ];
  for (const [label, value] of entries) {
    const metric = document.createElement('div');
    metric.className = 'metric';
    appendText(metric, 'span', label, 'label');
    appendText(metric, 'strong', value, 'value');
    grid.append(metric);
  }
  wrapper.append(grid);
  shadow.append(wrapper);
  return mount;
}
