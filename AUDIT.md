# VTOP Modern architecture audit

Date: 2026-10-18

This audit is based on the tracked source and local fixtures. No authenticated
VTOP session was available, so portal selectors, navigation destinations, and
runtime behavior against live VTOP remain unverified.

## Baseline

- Repository is a clean Manifest V3 extension with no package manager,
  TypeScript, bundler, lockfile, CI, Dockerfile, or unified check command.
- The existing `node test-attendance.js` check passes all 8 cases, but it
  reimplements the production formula instead of importing it.
- Four broad `MutationObserver` instances are created by the content,
  attendance, timetable, and login scripts. Each can schedule independent
  whole-page work.
- The content privacy scanner reads `innerText` from every `td`, `span`,
  `div`, `strong`, `b`, `h4`, and `h5`, then scans all tables. Attendance and
  timetable each scan all tables again. This is a static source-level finding;
  no live timing measurement is claimed.
- Feature mounts are guarded by global IDs or permanent table flags, but table
  replacement and repeated initialization are not reconciled consistently.

## Actual architecture and feature map

| Area              | Entry point and behavior                                                                                              | Classification                                                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Content bootstrap | `manifest.json` loads seven ordered scripts at `document_start` on all configured hosts.                              | Partially working; relies on script order and runs unrelated features on every page.                                                 |
| Popup             | `popup/popup.html` and `popup/popup.js` read sync preferences and a local attendance summary.                         | Partially working; switches write settings but `attendanceCalc` and `autoFocus` are not consumed by feature code.                    |
| Preferences       | `storage.sync` plus page `localStorage` theme state.                                                                  | Heuristic and inconsistent; popup uses `data-theme`, portal pages use `data-vtop-theme`.                                             |
| Attendance        | `scripts/attendance.js` detects headers heuristically, appends a quota column/card, and writes a local summary.       | Partially working; math is sound for valid integer units, but parsing and permanent processed flags are unsafe for dynamic updates.  |
| Privacy           | `scripts/content.js` applies blur classes to broad text/table matches and adds click/keyboard reveal.                 | Heuristic and best-effort; broad scans, CSS-only masking, and mismatched storage event names.                                        |
| Timetable         | `scripts/timetable.js` detects generic theory/lab tables and copies today's non-empty cells.                          | Heuristic; actual structure, times, rooms, and chronological semantics are unknown until live verification.                          |
| Command palette   | `scripts/command-palette.js` searches commands and guesses visible links/hrefs.                                       | Partially working; keyboard flow exists, but empty-result modulo, extra modifiers, unsafe HTML, and unsupported destinations remain. |
| Login helper      | `scripts/login-helper.js` targets known IDs/names, uppercases username, focuses fields, and submits the student form. | Partially working; selectors and pre-login context are unverified; direct `form.submit()` can bypass browser submit behavior.        |
| Theme             | `scripts/theme-manager.js` applies an early local theme and syncs later.                                              | Partially working; multiple sources of truth and remote font imports conflict with local-only claims.                                |

## Confirmed root causes and risks

1. Each feature owns a broad observer, creating duplicate scans and lifecycle
   work (`scripts/content.js`, `scripts/attendance.js`,
   `scripts/timetable.js`, `scripts/login-helper.js`).
2. Attendance sets `data-vtop-modern-processed` permanently and creates a
   page-global summary, so retained tables with replaced rows become stale and
   multiple relevant tables collide.
3. Attendance and timetable interpolate portal-controlled text into
   `innerHTML`; this is an unsafe page-content-to-HTML path.
4. Privacy scans large subtrees and uses a visual blur rather than a
   confidentiality boundary. It must be documented as best-effort on-screen
   concealment.
5. `theme-manager.js` dispatches `vtop-cgpa-toggle`, while `content.js` listens
   for `vtop-cgpa-toggle-request`, so storage-driven privacy changes do not
   reliably update open pages.
6. The old attendance test duplicates `calculateMetrics`; it does not protect
   the production implementation and rounds status inputs differently.
7. Google Fonts are imported by `styles/theme.css` and `popup/popup.css`,
   contradicting the stated zero-network/local-only model.
8. README installation and compatibility claims are not backed by a build,
   typecheck, browser integration test, or live VTOP verification.

## Recommended migration sequence

1. Add a pinned Node/WXT/TypeScript/Vitest toolchain and a reproducible build
   boundary while preserving the existing VTOP host matches and icons.
2. Extract typed, pure attendance, storage, route, privacy, and timetable
   adapters with sanitized fixture tests.
3. Replace broad observers with one scoped lifecycle coordinator that coalesces
   mutations, ignores extension-owned roots, and reconciles affected tables.
4. Mount extension-owned UI in an isolated Shadow DOM root and construct all
   portal-derived text with safe DOM APIs.
5. Rebuild popup state synchronization around one typed storage contract and
   validate feature flags, theme values, and cached summaries.
6. Run strict typecheck, lint, formatting, unit tests, Chromium/Firefox builds,
   and a final static security review. Report live VTOP gaps separately.
