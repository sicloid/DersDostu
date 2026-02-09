# Tech Context

## Technologies Used
*   **Core:** Go 1.23, Wails v2.11
*   **Web Framework:** Fiber (Go) for local file serving
*   **Database:** SQLite (`go-sqlite3`)
*   **Speech-to-Text:** Vosk (Offline) with PortAudio for microphone capture.
*   **Discovery:** mDNS (Zeroconf / Bonjour) - planned
*   **Frontend:** React 18, TypeScript, Vite, Tailwind CSS

## Development Setup
*   **OS:** Linux (Development), Windows 8.1+ (Target)
*   **Requirements:** Go 1.23+, Node.js, Wails CLI, GCC (for CGO/SQLite)
*   **Libraries (Linux):** `libportaudio2`, `portaudio19-dev`, `libvosk`.
*   **Build Command (Linux Dev):** `wails dev -tags webkit2_41` (Required for Ubuntu 24.04+)

## Technical Constraints
*   **Hardware:** Intel i3-3120M (3rd Gen), 4GB RAM, Intel HD 4000 GPU (Vestel Faz 1/2).
*   **GPU Limits:** No `backdrop-filter` or complex blurs; minimal box-shadows.
*   **RAM Limits:** 2GB maximum available for app; Undo history capped at 30 steps.
*   **CPU Limits:** Max 15-20 FPS recording to prevent input lag.
*   **No Internet:** System must be 100% functional via LAN/Localhost.
*   **Audio Hardware:** Persistent PortAudio stream required for ALSA stability on Linux.

## Dependencies
**Backend (Go):**
*   `github.com/alphacep/vosk-api/go` (STT Engine)
*   `github.com/gordonklaus/portaudio` (Microphone access)
*   `github.com/gofiber/fiber/v2`
*   `github.com/mattn/go-sqlite3`

**Frontend (NPM):**
*   `react`, `react-dom`
*   `framer-motion`
*   `lucide-react` (Icons for UI)
*   `jspdf` (PDF generation)

## Frontend Component Architecture
*   **App.tsx:** Root component with state management
*   **Sidebar.tsx:** Tools, undo/redo, color/size, and navigation.
*   **Canvas.tsx:** Main drawing surface with textbox and STT integration.
