import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { browser } from 'wxt/browser';

import { isSupportedVtopHost } from '../../src/core/routing/vtop-route';
import { createSettingsStore, createSummaryStore } from '../../src/core/storage/store';
import { toggleTheme } from '../../src/features/theme/theme';
import type { AttendanceSummary, ExtensionSettings, ThemePreference } from '../../src/types/domain';
import './style.css';

const settingsStore = createSettingsStore();
const summaryStore = createSummaryStore();

function PopupApp() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [hostname, setHostname] = useState<string | null>(null);

  useEffect(() => {
    void settingsStore.get().then((value) => {
      setSettings(value);
      applyPopupTheme(value.theme);
    });
    void browser.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        const url = tabs[0]?.url;
        if (!url) return null;
        try {
          const hostname = new URL(url).hostname;
          return isSupportedVtopHost(hostname) ? hostname : null;
        } catch {
          return null;
        }
      })
      .then(setHostname)
      .catch(() => setHostname(null));
    return settingsStore.subscribe((value) => {
      setSettings(value);
      applyPopupTheme(value.theme);
    });
  }, []);

  useEffect(() => {
    setSummary(null);
    if (!hostname) return;
    const syncSummary = (): void => {
      void summaryStore.get(hostname).then(setSummary);
    };
    syncSummary();
    return summaryStore.subscribe(hostname, setSummary);
  }, [hostname]);

  if (!settings) return <div className="loading">Loading preferences…</div>;

  const patch = (value: Partial<ExtensionSettings>): void => {
    void settingsStore.set(value).then(setSettings);
  };
  const nextTheme = toggleTheme(settings.theme);
  const themeLabel = nextTheme === 'light' ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <div className="shell">
      <header className="header">
        <div className="brand-mark" aria-hidden="true">
          V
        </div>
        <div>
          <strong>VTOP Modern</strong>
          <span>Academic companion</span>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={() => patch({ theme: nextTheme })}
          aria-label={themeLabel}
          title={themeLabel}
        >
          {nextTheme === 'light' ? '☾' : '☼'}
        </button>
      </header>

      <section className="section" aria-labelledby="standing-title">
        <p className="eyebrow" id="standing-title">
          Academic standing
        </p>
        <p className="context">
          {hostname
            ? `Current portal · ${hostname}`
            : 'Open a supported VTOP tab to view local data.'}
        </p>
        {summary ? <Summary summary={summary} /> : <EmptySummary />}
      </section>

      <section className="section" aria-labelledby="preferences-title">
        <p className="eyebrow" id="preferences-title">
          Preferences
        </p>
        <div className="preference-list">
          <Preference
            label="Attendance planning"
            description="Add 75% planning metrics"
            checked={settings.attendanceCalc}
            onChange={(checked) => patch({ attendanceCalc: checked })}
          />
          <Preference
            label="Privacy shield"
            description="Best-effort on-screen concealment"
            checked={settings.privacyShield}
            onChange={(checked) => patch({ privacyShield: checked })}
          />
          <Preference
            label="Login assistance"
            description="Uppercase registration number and focus fields"
            checked={settings.autoFocus}
            onChange={(checked) => patch({ autoFocus: checked })}
          />
          <Preference
            label="Timetable highlight"
            description="Mark today's portal row"
            checked={settings.timetableHighlight}
            onChange={(checked) => patch({ timetableHighlight: checked })}
          />
        </div>
      </section>

      <section className="section" aria-labelledby="links-title">
        <p className="eyebrow" id="links-title">
          Student access
        </p>
        <div className="links">
          <QuickLink href="https://vtopcc.vit.ac.in/vtop/open/page" label="VTOP CC" />
          <QuickLink href="https://vtop.vit.ac.in/vtop/open/page" label="VTOP Vellore" />
          <QuickLink href="https://outlook.office.com" label="VIT Mail" />
          <QuickLink href="https://lms.vit.ac.in" label="LMS" />
        </div>
      </section>
      <footer>Local-only · no telemetry · press Ctrl/Cmd+K on VTOP</footer>
    </div>
  );
}

function Summary({ summary }: { summary: AttendanceSummary }) {
  const unitLabel =
    summary.unit === 'hours' ? 'hours' : summary.unit === 'classes' ? 'classes' : 'units';
  return (
    <div className="summary-card">
      <div className="summary-top">
        <strong>{summary.formattedPercent}</strong>
        <span className={`status ${summary.status.toLowerCase()}`}>
          {summary.status === 'CRITICAL'
            ? `${summary.coursesBelow75} below 75%`
            : `${summary.safeAbsences} safe absences`}
        </span>
      </div>
      <div className="summary-detail">
        {summary.attended} of {summary.conducted} {unitLabel} attended
      </div>
    </div>
  );
}

function EmptySummary() {
  return (
    <div className="empty-card">
      <strong>No attendance synced</strong>
      <span>Open a VTOP attendance page to calculate a local summary.</span>
    </div>
  );
}

function Preference({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      className="preference"
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <div>
        <strong>{label}</strong>
        <span>{description}</span>
      </div>
      <span className="switch" aria-hidden="true">
        <span />
      </span>
    </button>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {label}
      <span aria-hidden="true">↗</span>
    </a>
  );
}

function applyPopupTheme(theme: ThemePreference): void {
  const value =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark'
      : theme;
  document.documentElement.dataset.theme = value;
}

render(<PopupApp />, document.getElementById('app') as HTMLElement);
