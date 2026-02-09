# Project Brief

# Project Brief

## Core Requirements & Goals
**Project Identity:** "DersDostu v2.0" (AI-Powered & Offline-First)
**Mission:** Revitalize aging "FATİH Project" smart boards using cutting-edge **Edge AI** and **Go** performance optimizations.

**Goals:**
1.  **Hardware Optimization:** Run high-performance system on constrained hardware (Intel i3 3rd Gen, 4GB RAM).
2.  **"Grandpa-Proof" UX:** Zero technical friction for older teachers.
3.  **Local-First & AI-Enhanced:** Offline file sharing via local server (mDNS) and on-device AI for shape recognition.
4.  **Administrative Efficiency:** SQLite-backed attendance compatible with E-Okul.

## Project Scope
**Core Features:**
*   **Smart Canvas (TinyML):** "Auto-Shape Mode" using simple heuristics or lightweight ONNX to convert rough drawings to perfect vectors.
*   **Automated Emailer:** Mass email distribution of lesson PDFs to students (replacing QR codes due to phone ban).
*   **Strict Attendance:** SQLite database (`attendance.db`) for crash-resilient data storage and fast reporting.
*   **Lesson Recording:** Background FFMPEG recording.
*   **Offline-First:** All data saves locally first.

**Constraints:**
*   **Target OS:** Windows 8.1 / 10 / 11.
*   **Output:** Portable `.exe` (Bit-stripped `-ldflags="-s -w"`).
*   **Performance:** STRICT optimization. Low CPU usage.


