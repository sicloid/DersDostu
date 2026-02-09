# DersDostu Windows Setup & Installation Guide

This guide will help you set up and run **DersDostu** on a Windows machine.

## Prerequisites

Before starting, ensure you have the following installed:

1.  **Go (Golang)**: Download and install from [go.dev/dl](https://go.dev/dl/).
    *   *Verify*: Open Command Prompt (original or PowerShell) and type `go version`.
2.  **Node.js**: Download and install the LTS version from [nodejs.org](https://nodejs.org/).
    *   *Verify*: Type `node -v` and `npm -v`.
3.  **Wails CLI**: Install the Wails command-line tool.
    *   Command: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
    *   *Verify*: Type `wails version`.
4.  **TDM-GCC (C Compiler)**: Required for CGO.
    *   Download from [jmeubank.github.io/tdm-gcc/](https://jmeubank.github.io/tdm-gcc/).
    *   **Important**: During installation, select "Add to PATH".
5.  **FFmpeg** (For Screen Recording):
    *   Download a build from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/).
    *   Extract the folder (e.g., to `C:\ffmpeg`).
    *   Add the `bin` folder (e.g., `C:\ffmpeg\bin`) to your System Environment Variables PATH.
    *   *Verify*: Type `ffmpeg -version`.
6.  **WebView2 Runtime**:
    *   Most modern Windows 10/11 installations have this. If not, download "Evergreen Bootstrapper" from [Microsoft](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).

## Installation

1.  **Clone the Repository**:
    ```powershell
    git clone https://github.com/sicloid/DersDostu.git
    cd DersDostu
    ```

2.  **Install Frontend Dependencies**:
    ```powershell
    cd frontend
    npm install
    cd ..
    ```

3.  **Setup Offline Speech Recognition (Vosk)**:
    *   Create a `models` folder in the root `DersDostu` directory.
    *   Download the **Turkish** small model (e.g., `vosk-model-small-tr-0.3`) from [alphacephei.com](https://alphacephei.com/vosk/models).
    *   Extract the archive so that the folder structure looks like:
        `DersDostu/models/vosk-model-small-tr-0.3/`

## Running the Application

To run the application in development mode (with hot reload):

```powershell
wails dev
```

To build a production `.exe`:

```powershell
wails build
```
The executable will be located in `build/bin/DersDostu.exe`.

## Troubleshooting

-   **"gcc is not recognized"**: Re-install TDM-GCC and ensure "Add to Path" is checked.
-   **"StartRecording failed"**: Ensure FFmpeg is in your PATH. Windows uses `gdigrab` for recording.
-   **Speech Recognition issues**: Check that the `models` folder exists and contains the correct model folder name matching `internal/speech/service.go`.
