import { defineContentScript } from 'wxt/utils/define-content-script';

import { LifecycleCoordinator } from '../src/core/dom/lifecycle';
import { detectVtopRoute, VTOP_MATCH_PATTERNS } from '../src/core/routing/vtop-route';
import { createSettingsStore, createSummaryStore } from '../src/core/storage/store';
import { clearAttendanceEnhancements, enhanceAttendance } from '../src/features/attendance/feature';
import { CommandPalette } from '../src/features/command-palette/feature';
import { enhanceLogin, focusLoginField, shouldFocusLoginField } from '../src/features/auth/login';
import {
  createPrivacyDock,
  shieldAcademicValues,
  updatePrivacyDock,
  updatePrivacyShield,
} from '../src/features/privacy/shield';
import { applyTheme, installSystemThemeListener, toggleTheme } from '../src/features/theme/theme';
import { clearTimetableEnhancements, enhanceTimetable } from '../src/features/timetable/feature';
import type { ExtensionSettings } from '../src/types/domain';
import '../src/styles/content.css';

export default defineContentScript({
  matches: [...VTOP_MATCH_PATTERNS],
  runAt: 'document_start',
  main() {
    const initialRoute = detectVtopRoute(window.location);
    if (!initialRoute.supportedHost) return;

    const settingsStore = createSettingsStore();
    const summaryStore = createSummaryStore();
    let settings: ExtensionSettings = {
      theme: 'system',
      attendanceCalc: true,
      privacyShield: true,
      autoFocus: true,
      timetableHighlight: true,
    };
    let settingsReady = false;
    let dock: HTMLElement | null = null;
    let palette: CommandPalette | null = null;
    let authSummaryCleared = false;

    const setTheme = (next = settings.theme): void => {
      settings = { ...settings, theme: next };
      applyTheme(next);
    };
    const setPrivacy = (enabled: boolean): void => {
      settings = { ...settings, privacyShield: enabled };
      shieldAcademicValues(document, enabled);
      updatePrivacyShield(document, enabled);
      if (dock) updatePrivacyDock(dock, enabled);
      void settingsStore.set({ privacyShield: enabled });
    };
    const togglePageTheme = (): void => {
      const next = toggleTheme(settings.theme);
      setTheme(next);
      void settingsStore.set({ theme: next });
    };

    applyTheme(settings.theme);
    palette = new CommandPalette({
      togglePrivacy: () => setPrivacy(!settings.privacyShield),
      toggleTheme: togglePageTheme,
    });
    palette.start();

    const coordinator = new LifecycleCoordinator();
    coordinator.subscribe('parse', (event) => {
      if (!settingsReady) return;
      const route = detectVtopRoute(window.location);
      const roots = event.type === 'initial' || event.roots.length === 0 ? [document] : event.roots;

      if (settings.attendanceCalc && (route.page === 'attendance' || route.page === 'unknown')) {
        enhanceAttendance(event);
      } else {
        clearAttendanceEnhancements(document);
      }

      if (settings.privacyShield) {
        for (const root of roots) shieldAcademicValues(root, true);
      }

      if (settings.timetableHighlight && (route.page === 'timetable' || route.page === 'unknown')) {
        enhanceTimetable(event);
      } else {
        clearTimetableEnhancements(document);
      }

      if (route.page === 'login' || route.page === 'prelogin') {
        enhanceLogin(event);
        if (
          settings.autoFocus &&
          shouldFocusLoginField(event) &&
          !(
            document.activeElement instanceof HTMLInputElement ||
            document.activeElement instanceof HTMLTextAreaElement ||
            document.activeElement instanceof HTMLSelectElement ||
            (document.activeElement instanceof HTMLElement &&
              document.activeElement.isContentEditable)
          )
        ) {
          window.setTimeout(focusLoginField, 0);
        }
      }
      if (route.page === 'login' || route.page === 'prelogin') {
        if (!authSummaryCleared) {
          authSummaryCleared = true;
          void summaryStore.clear(window.location.hostname);
        }
      } else {
        authSummaryCleared = false;
      }
    });
    coordinator.subscribe('visual', () => {
      if (!document.body || dock) return;
      dock = createPrivacyDock(
        settings.privacyShield,
        setPrivacy,
        () => palette?.open(),
        togglePageTheme,
      );
      document.body.append(dock);
    });
    coordinator.start();

    void settingsStore.get().then((stored) => {
      settings = stored;
      settingsReady = true;
      setTheme(stored.theme);
      shieldAcademicValues(document, stored.privacyShield);
      updatePrivacyShield(document, stored.privacyShield);
      if (dock) updatePrivacyDock(dock, stored.privacyShield);
      coordinator.refresh();
    });
    settingsStore.subscribe((stored) => {
      const previous = settings;
      settings = stored;
      applyTheme(stored.theme);
      shieldAcademicValues(document, stored.privacyShield);
      updatePrivacyShield(document, stored.privacyShield);
      if (dock) updatePrivacyDock(dock, stored.privacyShield);
      if (previous.attendanceCalc && !stored.attendanceCalc) clearAttendanceEnhancements(document);
      if (previous.attendanceCalc && !stored.attendanceCalc)
        void summaryStore.clear(window.location.hostname);
      if (previous.timetableHighlight && !stored.timetableHighlight)
        clearTimetableEnhancements(document);
      if (settingsReady) coordinator.refresh();
    });
    installSystemThemeListener(() => settings.theme);
  },
});
