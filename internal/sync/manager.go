package sync

import (
	"fmt"
	"os"
	"path/filepath"
)

// SyncManager handles the upload of lesson files
// In a real scenario, this would interface with FTP or Google Drive.
// For the Hackathon/MVP, it provides a Mock implementation.
type SyncManager struct {
	IsUploading bool
	PublicDir   string
}

// NewSyncManager creates a new instance
func NewSyncManager(publicDir string) *SyncManager {
	return &SyncManager{
		IsUploading: false,
		PublicDir:   publicDir,
	}
}

// UploadFile simulates a file upload process (Dual Layer)
// Layer 1: Save locally to "public" for LAN access (Immediate)
// Layer 2: Upload to Cloud/FTP (Background)
func (s *SyncManager) UploadFile(filename string, data []byte) (string, string, error) {
	s.IsUploading = true
	defer func() { s.IsUploading = false }()

	// 1. Save Locally (Layer A)
	localPath := filepath.Join(s.PublicDir, filename)
	if err := os.WriteFile(localPath, data, 0644); err != nil {
		return "", "", fmt.Errorf("failed to save local file: %v", err)
	}

	// 2. Return Local URL immediately
	// Assumes Fiber is running on :8080
	// In production, get real IP. For now, localhost is fine for the board itself,
	// but for students scanning QR, we need the LAN IP.
	// For MVP, we return a placeholder that Frontend can replace with window.location.hostname
	url := fmt.Sprintf("http://<BOARD_IP>:8080/%s", filename)
	return url, localPath, nil

	// 3. Trigger Background Upload (Layer B) - TODO
	// go s.uploadToCloud(localPath)
}
