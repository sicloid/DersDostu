package recorder

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"
	"time"
)

type RecorderService struct {
	cmd         *exec.Cmd
	IsRecording bool
	PublicDir   string
}

func NewRecorderService(publicDir string) *RecorderService {
	return &RecorderService{
		IsRecording: false,
		PublicDir:   publicDir,
	}
}

func (r *RecorderService) StartRecording(filename string) error {
	if r.IsRecording {
		return fmt.Errorf("recording already in progress")
	}

	outputPath := filepath.Join(r.PublicDir, filename)

	// Ensure file doesn't exist? ffmpeg -y overwrites.

	var cmd *exec.Cmd

	if runtime.GOOS == "windows" {
		// Windows: gdigrab - reduced FPS for old i3/i5
		cmd = exec.Command("ffmpeg", "-f", "gdigrab", "-framerate", "15", "-i", "desktop", "-preset", "ultrafast", "-y", outputPath)
	} else if runtime.GOOS == "linux" {
		// Linux: x11grab + pulse

		// 1. Detect Display
		display := os.Getenv("DISPLAY")
		if display == "" {
			display = ":0"
		}

		// 2. Detect Resolution
		// Default to 1920x1080 if detection fails
		resolution := "1920x1080"

		out, err := exec.Command("xrandr").Output()
		if err == nil {
			// Parse output for the mode with '*'
			// Example line: "   1920x1200    164.87*+"
			lines := strings.Split(string(out), "\n")
			for _, line := range lines {
				if strings.Contains(line, "*") {
					fields := strings.Fields(line)
					if len(fields) > 0 {
						resolution = fields[0]
						break
					}
				}
			}
		}

		fmt.Printf("Recording on Display: %s with Resolution: %s\n", display, resolution)

		cmd = exec.Command("ffmpeg",
			"-f", "x11grab",
			"-video_size", resolution,
			"-framerate", "15",
			"-i", display,
			"-f", "pulse",
			"-i", "default",
			"-c:v", "libx264",
			"-preset", "ultrafast",
			"-c:a", "aac",
			"-y", outputPath,
		)
	} else {
		return fmt.Errorf("unsupported OS for recording")
	}

	// Capture stdout/stderr for debugging
	logFile, err := os.Create(filepath.Join(r.PublicDir, "ffmpeg_log.txt"))
	if err == nil {
		cmd.Stdout = logFile
		cmd.Stderr = logFile
		defer logFile.Close()
	}

	r.cmd = cmd
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start ffmpeg: %v", err)
	}

	// Verification: Wait a bit to ensure it doesn't crash immediately.
	// Instead of calling Wait() which blocks and consumes the status,
	// we simply sleep and check if process is still alive.
	time.Sleep(500 * time.Millisecond)

	// Check if process is alive by sending signal 0 (Linux/Unix only)
	if runtime.GOOS != "windows" {
		if err := r.cmd.Process.Signal(syscall.Signal(0)); err != nil {
			// Process likely dead.
			r.cmd.Wait() // Clean up resources
			r.cmd = nil
			r.IsRecording = false
			return fmt.Errorf("ffmpeg exited immediately (check logs)")
		}
	}

	r.IsRecording = true
	return nil
}

func (r *RecorderService) StopRecording() error {
	if !r.IsRecording || r.cmd == nil {
		return fmt.Errorf("no recording in progress")
	}

	// Send Interrupt signal (SIGINT) to tell ffmpeg to stop and save gracefully
	if err := r.cmd.Process.Signal(os.Interrupt); err != nil {
		// Process might already be dead, try to wait anyway
		r.cmd.Wait()
		r.IsRecording = false
		r.cmd = nil
		return fmt.Errorf("failed to signal process: %v", err)
	}

	// Wait for process to exit, but with a timeout
	// Use a channel to wait for the process
	done := make(chan error, 1)
	go func() {
		done <- r.cmd.Wait()
	}()

	// Wait up to 5 seconds for graceful shutdown
	select {
	case err := <-done:
		// Process exited gracefully
		fmt.Printf("Recording stopped gracefully: %v\n", err)
	case <-time.After(5 * time.Second):
		// Timeout - force kill
		fmt.Println("Timeout waiting for ffmpeg to stop, force killing...")
		r.cmd.Process.Kill()
		<-done // Wait for the killed process to finish
	}

	r.IsRecording = false
	r.cmd = nil
	return nil
}
