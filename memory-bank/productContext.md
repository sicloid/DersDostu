# Product Context

# Product Context

## Why this project exists
Thousands of smart boards are "rotting away". We are transforming them into powerful offline teaching hubs using modern tech stack (Go + AI) to bypass hardware- **Paint-Style Canvas**: Familiar UX with pencil, eraser, and auto-pen tools.
- **Floating Toolbar**: Maximum canvas space for drawing.
- **Smart Textbox**: Resizable overlay with multi-line support and touch-safe controls.
- **Voice-Enabled Workflow**: Offline STT for hands-free typing and tool switching via voice commands.
- **Screen Recording**: High-performance FFmpeg capture for lesson archiving.
- **Offline Reliability**: 100% functional without internet connectivity.
" assists teachers in drawing perfect diagrams without skill.
4.  **Data Integrity:** SQLite (WAL mode) ensures attendance data is never lost, even on power cut.

## How it should work
**"Hybrid Kiosk" Model:**
- Runs as a desktop app (Fullscreen default).
- **"Flat-over-Glass" Strategy:** Avoids GPU-heavy translucency (`backdrop-blur`) in favor of premium solid colors to ensure smooth performance on Intel HD 4000 graphics.
- **Workflow:**
    1.  **Launch:** App opens, background recording, Local HTTP Server starts (`:8080`).
    2.  **Teach:** Teacher draws. AI assists with shapes. Auto-save to SQLite/Files.
    3.  **Share:** Students get PDFs via asynchronous email distribution (as mobile phones are banned in classrooms).

## User Experience Goals
*   **"Grandpa-Proof":**
    *   **Floating Vertical Toolbar:** Maximum canvas space; large touch targets (48px+).
    *   **Visuals:** High-contrast, sharp boundaries, animated tooltips for clarity.
    *   **Feedback:** Smooth micro-animations (Framer Motion) to confirm actions (e.g., "Saved" pulse).
*   **Performance Resilience:** Snappy UI interactions even on i3-3120M systems with 4GB RAM.
*   **Instant Gratification:** Students get notes immediately via email.
*   **Resilience:** Works perfectly with 0% Internet connectivity.


