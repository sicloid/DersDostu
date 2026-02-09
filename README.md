# DersDostu (Lesson Friend)

DersDostu is a high-performance, offline-first educational tool designed to revitalize aging smart boards (like Vestel Faz 1/2). It provides a smart drawing canvas, AI-powered shape detection, offline Turkish Speech-to-Text (STT), and automated lesson archiving.

## Key Features
- **Smart Canvas**: Resizable and interactive drawing surface with pagination.
- **Offline Turkish STT**: Powered by Vosk for hands-free typing and commands.
- **Optimized for Legacy Hardware**: Smooth 15 FPS recording and light UI for Intel HD 4000 GPUs.
- **Automated Archiving**: Screen recording and PDF generation for easy sharing.
- **Privacy-First**: 100% offline, data never leaves the local network.

## Installation & Setup

### Windows
For detailed Windows installation and setup instructions, please read [WINDOWS_SETUP.md](WINDOWS_SETUP.md).

### General Requirements
- **Go** (v1.20+)
- **Node.js** (v18+)
- **Wails** (v2)
- **FFmpeg** (Required for screen recording)

## Tech Stack
- **Backend**: Go (Wails v2)
- **Frontend**: React, Tailwind CSS, Framer Motion
- **AI**: Vosk (Speech), Heuristic Algorithms (Shapes)

## License
MIT
