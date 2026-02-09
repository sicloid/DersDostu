# Active Context

## Current Work Focus
*   **Module A (Lesson Flow): COMPLETED** ✅
    *   Drawing tools, undo/redo, and background persistence.
*   **Module C (Text & Speech): COMPLETED** ✅
    *   Paint-style multi-line textboxes with touch-safe controls.
    - Offline Turkish STT with Vosk and PortAudio stability fixes.
*   **Next Phase:** Module B (Attendance System)

## Recent Changes
*   **2026-02-09:** Potato PC & STT Stabilization
    - Implemented **Persistent Audio Stream** to resolve ALSA "File descriptor in bad state" errors on Linux.
    - Added **Xrun Recovery** and application-level `OnShutdown` hardware release.
    - Optimized for **Legacy Hardware**: Removed `backdrop-blur`, capped undo history at 30 steps, and set FFmpeg to 15 FPS / `ultrafast`.
    - Applied `React.memo` to `Sidebar` to isolate canvas drawing from UI re-renders.
*   **2026-02-09:** Initial STT Stabilization
    - Fixed `SIGSEGV` and deadlocks in Go backend using `sync.Mutex` and `sync.WaitGroup`.
    - Implemented bi-directional state sync with `speech-started` and `speech-stopped` events.
*   **2026-02-08:** Implemented Paint-style Text Tool
    - Created resizable overlay for multi-line text input.
    - Integrated Vosk offline STT for hands-free typing.

## Next Steps
1.  **Module B:** Design and implement student data model (SQLite/JSON).
2.  **Module B:** Create attendance grid UI component.
3.  **Module B:** Implement E-Okul export functionality.
4.  **Hardware:** Stress-test on **Intel i3-3120M / 4GB RAM** (Vestel Faz 1/2).
5.  **Module A:** Refine selection tool scaling (stretch image on resize).

## Active Decisions & Considerations
*   **UI Layout:** Scrapped fixed sidebar in favor of floating vertical toolbar (User request)
*   **Drawing Controls:** Live color/size changes apply immediately to canvas rendering
*   **Email Distribution:** Asynchronous goroutine implementation prevents UI blocking
*   **Potato PC Strategy:** Flat UI over Glassmorphism; prioritize high-opacity solids over GPU-heavy blurs.
*   **Audio Lifecycle:** Persistent stream opened once at startup, paused via `Stop()`, closed only at `Shutdown()`.
*   **Local Server:** Go Fiber on port 8080 for file serving.

## Important Patterns & Preferences
*   **Component Architecture:** Sidebar (left) + Canvas (center) + DrawingPanel (right)
*   **State Management:** React hooks for brush color, size, recording state
*   **SyncManager:** Resilient with retry logic (mock for hackathon)
*   **CGO:** Required for `go-sqlite3`. Ensure GCC is available
*   **Binary Size:** Use `-ldflags="-s -w"` to strip debug symbols

## Learnings & Project Insights
*   Fixed positioning (`fixed left-0 top-0 bottom-0`) is more reliable than flexbox for sidebars in Wails/WebView2
*   Paint-style tool panels are intuitive for teachers (familiar UX pattern)
*   Offline capability remains #1 feature priority

