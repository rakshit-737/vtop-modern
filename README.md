# 🎓 VTOP Modern — Academic Companion for VIT Students

**VTOP Modern** is a high-performance browser extension (Manifest V3) that transforms the Vellore Institute of Technology student portal (**VTOP**) into a focused, modern academic companion.

Designed with principles from **Linear**, **Raycast**, and **Arc**, it replaces legacy tables, cluttered layouts, and archaic UI with exact mathematical attendance tracking, an academic privacy shield, a keyboard-driven command menu, and an obsidian design system.

---

## ✨ Features

### 📊 Exact 75% Attendance Engine & "What-If" Simulator
- **Integer Math Calculation**: Mathematically verified integer formulas (`floor((4A - 3C) / 3)` for bunks, `max(0, 3C - 4A)` for recovery) with zero floating-point rounding errors.
- **Bunk Margin**: Instantly shows how many classes you can safely miss while remaining strictly $\ge 75\%$.
- **Recovery Quota**: When below 75%, clearly shows exactly how many consecutive classes you must attend to regain examination eligibility.
- **Interactive "What-If" Simulator**: Click the `±` button on any course row to test hypothetical future absences or attendances with live recalculated percentages.
- **Semester Overview Card**: Displays your aggregate attendance percentage, missable buffer pool, and debarment risk count.

### 🕶️ Academic Privacy Shield
- **Targeted Masking**: Automatically shields sensitive academic data (CGPA, semester GPA, exam marks, scores, and grades) from curious onlookers in labs or public areas.
- **Accessible Reveal**: Press `Enter` / `Space` or click any masked metric to momentarily reveal it without destroying or modifying the underlying DOM values.

### ⌨️ Raycast-Style Command Palette (`Ctrl+K` / `Cmd+K`)
- Press `Ctrl+K` (Windows/Linux) or `Cmd+K` (macOS) anywhere on VTOP.
- Instantly search and jump to Attendance, Class Timetable, Digital Assignments, Marks, or Exam Schedules without hunting through multi-level accordion menus.

### 📅 Daily Schedule & Slot Assistant
- Automatically parses the VTOP slot matrix into a clean **"Today's Schedule"** timeline card.
- Highlights today's day of the week and active lecture periods.

### ⚡ Frictionless Authentication
- Auto-capitalizes your Registration Number as you type (e.g., `21bce...` $\rightarrow$ `21BCE...`).
- Auto-focuses sequentially from username to password to captcha.
- Press `Enter` on the pre-login portal to immediately proceed to Student Login.

### 🎛️ Control Center Popup
- Real-time **Academic Standing Card** synced directly from your last viewed attendance.
- Tactile switch controls for feature toggles.
- Quick direct links to VIT Mail (Outlook) and Moodle LMS.

---

## 🛠️ Installation

### Chrome / Brave / Edge (Chromium)
1. Open your browser and navigate to:
   ```text
   chrome://extensions/
   ```
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click **"Load unpacked"** in the top-left corner.
4. Select the directory:
   ```text
   /home/rakshit-737/Desktop/projects/vtop-modern-extension
   ```
5. Open [https://vtopcc.vit.ac.in/vtop/open/page](https://vtopcc.vit.ac.in/vtop/open/page) and refresh the page!

### Firefox
1. In the address bar, type:
   ```text
   about:debugging#/runtime/this-firefox
   ```
2. Under **Temporary Extensions**, click **"Load Temporary Add-on..."**.
3. Select `manifest.json` from:
   ```text
   /home/rakshit-737/Desktop/projects/vtop-modern-extension/manifest.json
   ```
4. The extension is immediately loaded and active.

---

## 🔒 Security & Privacy Guarantees
- **100% Client-Side**: Executes exclusively in your local browser sandbox via content scripts.
- **Zero Telemetry**: No third-party trackers, no remote analytics, and zero external network requests.
- **Credential Safety**: Never reads, intercepts, or transmits your registration password or credentials.
