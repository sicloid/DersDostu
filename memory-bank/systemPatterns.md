# System Patterns

## System Architecture
**Stack:** Go (Golang) + Wails (v2) + React (TypeScript) + Tailwind CSS.
**AI Engine:** Simple Heuristics / ONNX Runtime (Go) for shape detection.
**Network:** Standard HTTP Client (SMTP in future).
**Database:** SQLite (`go-sqlite3`) with WAL mode.

**UI Architecture:**
1.  **Floating Toolbar (Vertical):** Fixed left positioning
    *   Tool selection (Select, Auto Pen, Pen, Eraser, Shapes)
    *   Color picker (Popover)
    *   Action buttons (Attendance, Finish)
2.  **Center Canvas (Canvas.tsx):** Main drawing area with pagination
    *   Dynamic brush color/size from DrawingPanel props
    *   Multi-page support with overlay controls
3.  **Right Panel (DrawingPanel.tsx):** Drawing tools (20px wide)
    *   Color picker (8 colors)
    *   Brush size selector (5 sizes)
    *   Record start/stop button

**Data Flow (Email Distribution):**
1.  **Input:** Strokes/Attendance saved locally.
2.  **Lesson End:** PDF Generated → `MailerService` invoked.
3.  **Distribution:** Mock/Real SMTP sends PDF to student list asynchronously (Goroutines).

## Key Technical Decisions
1.  **Dual-Sidebar Layout:** Maximizes canvas space, familiar teacher UX.
2.  **Fixed Positioning:** More reliable than flexbox in Wails/WebView2 environment.
3.  **STT Serialization & Persistence:** 
    - **Go Backend**: Uses `sync.Mutex` and `sync.WaitGroup` for resource safety.
    - **Persistent Stream**: Audio hardware is kept open throughout the session; `Stop()` and `Start()` are used to toggle data flow, avoiding unstable ALSA device cycles.
    - **ALSA Recovery**: Automatic stream reset on buffer underrun or "bad state" errors.
4.  **Legacy Hardware Optimization (Potato PC):**
    - **Render Isolation**: UI components are decoupled via `React.memo` to keep canvas processing lightweight.
    - **FPS Limitation**: Recording is capped at 15 FPS to prevent CPU saturation on i3 processors.
    - **Memory Capping**: Fixed-length history arrays prevent RAM exhaustion.
5.  **Paint-Style Text Tool:**
    - **Overlay UI**: Uses absolute-positioned React components over the canvas for interactive editing.
    - **Finalization**: Text is only committed to the canvas bitmap upon explicit dismissal (Tamam/Enter).
6.  **SQLite (Local State):** Embedded DB for app state.
7.  **SyncManager:** Separation of concerns. Handles network retries and abstraction of storage provider.

## Design Patterns in Use
*   **Service Layer:** `internal/speech` (Vosk/STT), `internal/server` (HTTP), `internal/ai` (Shape), `internal/db` (SQLite), `internal/mailer` (Email).
*   **Thread Safety:** Mutex-protected resources in Go for hardware access.
*   **Functional State Updates:** React `setState(prev => ...)` pattern for STT listeners to maintain state consistency across async events.

## Component Relationships
*   **Frontend:**
    *   `App.tsx`: Root component, state management.
    *   `Sidebar.tsx`: Memoized tool selection, undo/redo, brush controls.
    *   `Canvas.tsx`: Main drawing logic, capped history (30), and textbox/STT integration.
*   **Backend Services:**
    *   `SpeechService`: Manages Vosk transcription and PortAudio lifecycle.
    *   `RecorderService`: Manages FFMPEG screen capture.
    *   `SyncManager`: Handles file storage and returns URL + path.
