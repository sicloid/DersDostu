# Implementation Logs

This document archives the detailed implementation plans, task checklists, and technical decisions made during the development of DersDostu.

## 🎤 Offline Speech-to-Text (Vosk)
**Status:** Completed ✅ | **Date:** 2026-02-09

### Summary
Implemented a 100% offline Turkish STT solution using Vosk and PortAudio to overcome the limitations of the Web Speech API (network reliance) and Wails (browser restriction).

### Technical Decisions
- **Vosk**: Used `vosk-model-small-tr-0.3` for lightweight, CPU-efficient transcription.
- **PortAudio**: Used for low-latency microphone access on Linux.
- **Synchronization**: Implemented `sync.Mutex` and `sync.WaitGroup` in Go to safely handle audio hardware state and prevent SIGSEGV crashes.
- **Bi-Directional Sync**: Frontend/Backend state synchronization via `speech-started` and `speech-stopped` events.

### Implementation Checklist
- [x] Initial research and Vosk/PortAudio dependency mapping.
- [x] Model integration in `internal/speech/service.go`.
- [x] Wails binding setup.
- [x] Refactored React event listeners for functional updates.
- [x] **Bug Fix**: SIGSEGV crash during stop caused by race condition. (Fixed with WaitGroup)
- [x] **Bug Fix**: Restart failure caused by stale stop signals. (Fixed by draining channel)
- [x] **Bug Fix**: State leaks during textbox dismissal. (Fixed by hardening Enter/Esc/Cancel paths)
- [x] **Hardening**: Implemented **Persistent PortAudio Stream** and **Xrun Recovery** (2026-02-09).

---

## 🥔 Potato PC Optimization (Legacy Hardware)
**Status:** Completed ✅ | **Date:** 2026-02-09

### Summary
Optimized the application for 10-year-old hardware (Vestel Faz 1/2) to ensure smooth performance during lessons.

### Technical Decisions
- **GPU**: Removed `backdrop-blur` and heavy shadows in favor of high-opacity solid backgrounds.
- **RAM**: Capped undo history at **30 steps** to prevent memory exhaustion on 4GB systems.
- **CPU**: Set FFmpeg to **15 FPS** and `ultrafast` preset to reduce recording overhead.
- **React**: Wrapped the `Sidebar` in `React.memo` to isolate the UI from saniyede 60 kez tetiklenen çizim render'larından.

---

## 🎨 Paint-Style Text Tool
**Status:** Completed ✅ | **Date:** 2026-02-08

### Summary
Developed a "Paint-style" text tool that allows interactive textbox definitions on the canvas.

### Technical Decisions
- **Interactive Drag**: Users click and drag to define the area.
- **Native Input**: Uses an absolutely positioned `<textarea>` overlay for native multi-line input and word wrapping.
- **Canvas Rendering**: Text is committed to the canvas bitmap only after completion, supporting undo/redo.

---

## ✅ Completed Task Archive (Consolidated)

Below is a record of all completed tasks up to 2026-02-09:

### Core Infrastructure
- [x] Analyze codebase for errors
- [x] Downgrade Go version in go.mod for legacy compatibility
- [x] Review current UI components
- [x] Apply User's Sidebar Design (floating vertical toolbar)
- [x] Build and package application for Linux

### Feature Enhancements
- [x] Page Persistence: Refactored page switching logic to ensure drawings persist.
- [x] Selection Tool: Added rectangular selection, 8-handle resizing, and touch-friendly handles.
- [x] Undo/Redo: Implemented history stack with memory optimization.
- [x] Recording: Fixed FFmpeg exit 251 and implemented dynamic resolution detection.

### STT & Voice Commands
- [x] Offline Turkish STT with Vosk
- [x] Voice commands implementation (kırmızı kalem, mavi kalem, silgi, temizle)
- [x] Backend-Frontend integration via Wails
- [x] Debug and stabilize STT (Race conditions & Deadlocks fixed)

### Text Tool Implementation
- [x] Add text tool state management (TextInput interface)
- [x] Implement click-to-place text input
- [x] Create input overlay UI
- [x] Implement canvas text rendering (ctx.fillText)
- [x] Add font size selector to Sidebar
- [x] Add touch-friendly controls (Tamam/İptal)
- [x] Enable interactive resizing
- [x] **ALSA Stability**: Persistent audio stream and hardware recovery.
- [x] **Legacy Optimization**: Potato PC hardening (CSS, RAM, CPU).
