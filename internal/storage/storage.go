package storage

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
)

// StorageManager handles file system paths and directory creation
type StorageManager struct {
	BaseDir   string
	PublicDir string
	LogDir    string
	DBPath    string
}

// NewStorageManager initializes the storage paths
// On Windows: C:\DersDostu_Data
// On Linux/Mac: ~/DersDostu_Data
func NewStorageManager() (*StorageManager, error) {
	var baseDir string

	if runtime.GOOS == "windows" {
		// Use C:\DersDostu_Data for Windows as per requirements
		baseDir = `C:\DersDostu_Data`
	} else {
		// Use Home directory for Linux/Mac
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return nil, fmt.Errorf("could not get user home directory: %v", err)
		}
		baseDir = filepath.Join(homeDir, "DersDostu_Data")
	}

	sm := &StorageManager{
		BaseDir:   baseDir,
		PublicDir: filepath.Join(baseDir, "public"),
		LogDir:    filepath.Join(baseDir, "logs"),
		DBPath:    filepath.Join(baseDir, "dersdostu.db"),
	}

	if err := sm.ensureDirs(); err != nil {
		return nil, err
	}

	return sm, nil
}

// ensureDirs creates the necessary directories if they don't exist
func (sm *StorageManager) ensureDirs() error {
	dirs := []string{sm.BaseDir, sm.PublicDir, sm.LogDir}

	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return fmt.Errorf("failed to create directory %s: %v", dir, err)
		}
	}

	log.Printf("Storage initialized at: %s", sm.BaseDir)
	return nil
}

// GetPublicURL returns the local file path for a public asset
func (sm *StorageManager) GetPublicPath(filename string) string {
	return filepath.Join(sm.PublicDir, filename)
}
