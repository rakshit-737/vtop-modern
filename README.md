# VTOP Modern

A lightweight, privacy-focused browser extension that modernizes the Vellore Institute of Technology (VIT) student portal with keyboard-driven navigation, exact attendance metrics, and an academic privacy shield.

Compatible with **Chrome**, **Brave**, **Edge**, and **Firefox** (Manifest V3).

## About

VTOP Modern was built to address the persistent friction points in the Vellore Institute of Technology (VIT) student portal: visual clutter, nested navigation, lack of attendance buffer calculations, and exposed academic records on shared or monitored screens.

By treating the portal as a professional productivity environment rather than a legacy administrative viewer, VTOP Modern provides immediate answers to daily academic questions:
- *How many classes can I safely miss before dropping below the mandatory 75% threshold?*
- *What lectures and venues do I have scheduled today?*
- *How can I review attendance or marks without exposing my private CGPA to onlookers in a computer lab?*

### Topics & Tags

`vtop` • `vit` • `vit-chennai` • `vit-vellore` • `vit-ap` • `vit-bhopal` • `browser-extension` • `manifest-v3` • `chrome-extension` • `firefox-addon` • `attendance-calculator` • `student-portal` • `academic-privacy` • `command-palette` • `productivity`

---

## Overview

VTOP Modern replaces the legacy interface of VTOP with a restrained, high-density layout inspired by modern developer tools. It runs completely client-side, making zero network calls to third parties and transmitting no personal or academic data.

### Core Capabilities

- **Integer Attendance Engine**: Calculates safe bunk margins and recovery targets without floating-point errors.
- **What-If Attendance Simulator**: Interactive row-level drawer to test hypothetical absences or attendances.
- **Academic Privacy Shield**: Masks CGPA, GPA, CAT/FAT marks, and grades from public view with click-to-reveal.
- **Command Palette (`Ctrl+K` / `Cmd+K`)**: Rapid keyboard navigation across VTOP modules without nested menu drilling.
- **Daily Schedule Assistant**: Translates the weekly slot matrix into a clean, chronological "Today's Schedule" card.
- **Authentication Improvements**: Sequential field auto-focus, automatic uppercase formatting for registration numbers, and keyboard shortcuts.
- **Control Center Popup**: 340px compact extension popup with live academic standing and tactile preference switches.

---

## Keyboard Shortcuts

| Shortcut | Context | Action |
| :--- | :--- | :--- |
| `Ctrl + K` / `Cmd + K` | Portal Pages | Open the command palette to search and jump to pages |
| `Enter` / `Space` | Shielded Elements | Toggle visibility of a masked grade or CGPA metric |
| `Enter` or `S` | Pre-login Landing | Submit and proceed directly to Student Login |
| `Enter` | Password Field | Advance focus automatically to the Captcha input |
| `Esc` | Command Palette | Dismiss the command menu |

---

## Mathematical Specification

VTOP requires a minimum of **75% attendance** to be eligible for Final Assessment Tests (FAT). The extension uses exact integer arithmetic rather than decimal approximations to avoid off-by-one errors:

Let $A$ be attended hours and $C$ be conducted hours.

### Safe Bunk Allowance ($b$)
The maximum number of future classes that can be missed while keeping attendance at or above 75%:

$$\frac{A}{C + b} \ge 0.75 \implies 4A \ge 3(C + b) \implies b = \left\lfloor \frac{4A - 3C}{3} \right\rfloor$$

*(Applied when $4A \ge 3C$; otherwise 0 bunks available).*

### Recovery Target ($r$)
The minimum number of consecutive future classes that must be attended to bring attendance up to 75%:

$$\frac{A + r}{C + r} \ge 0.75 \implies 4(A + r) \ge 3(C + r) \implies r = \max(0, 3C - 4A)$$

### Aggregate Percentage
Computed strictly as:

$$\text{Aggregate } \% = \frac{\sum A_i}{\sum C_i} \times 100$$

The extension never averages percentages across courses, preventing incorrect weighting between theory and lab credit hours.

---

## Installation

### Chrome, Brave, and Edge

1. Navigate to `chrome://extensions/` (or `brave://extensions/`).
2. Toggle **Developer mode** on in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select the project directory:
   ```text
   ~/Desktop/projects/vtop-modern-extension
   ```
5. Navigate to [vtopcc.vit.ac.in](https://vtopcc.vit.ac.in/vtop/open/page) to verify.

### Firefox

1. In the address bar, enter:
   ```text
   about:debugging#/runtime/this-firefox
   ```
2. Under **Temporary Extensions**, click **Load Temporary Add-on...**.
3. Select `manifest.json` from the extension directory.
4. The extension will activate immediately.

---

## Project Structure

```text
vtop-modern-extension/
├── manifest.json              # Manifest V3 configuration (Chromium & Firefox Gecko ID)
├── test-attendance.js         # Automated mathematical verification test suite
├── icons/                     # Multi-resolution brand icons (16, 32, 48, 128px)
├── popup/
│   ├── popup.html             # Control center markup
│   ├── popup.css              # Compact 340px styling
│   └── popup.js               # State synchronization & storage handler
├── scripts/
│   ├── icons.js               # Unified Feather/Lucide vector SVG registry
│   ├── theme-manager.js       # Fast theme initializer (document_start)
│   ├── login-helper.js        # Autofocus & uppercase input formatting
│   ├── attendance.js          # Exact math engine & what-if simulator
│   ├── timetable.js           # Daily schedule card & slot highlighter
│   ├── command-palette.js     # Raycast-style keyboard navigation overlay
│   └── content.js             # Privacy shield & floating action dock
└── styles/
    ├── theme.css              # Obsidian dark & porcelain light design tokens
    ├── login.css              # Pre-login auth hub styling
    ├── dashboard.css          # Portal tables, panels, and dock layout
    ├── attendance.css         # Attendance overview grid & simulator drawer
    └── command-palette.css    # Command menu modal & search styles
```

---

## Security & Privacy Model

- **Local Execution**: All scripts run strictly within the client browser context.
- **Zero Network Egress**: The extension does not communicate with external servers, telemetry APIs, or remote databases.
- **Credential Isolation**: Passwords and session cookies are never captured, logged, or altered.

---

## License

MIT License. Developed for VIT students.
