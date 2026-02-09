package main

import (
	"DersDostu/internal/ai"
	"DersDostu/internal/db"
	"DersDostu/internal/mailer"
	"DersDostu/internal/recorder"
	"DersDostu/internal/sync"
	"context"
	"encoding/base64"
	"fmt"
	"time"
)

// App struct
type App struct {
	ctx      context.Context
	recorder *recorder.RecorderService
	sync     *sync.SyncManager
	ai       *ai.ShapeService
	db       *db.DBService
	mailer   *mailer.MailerService
	// fileServer *server.ServerService // Wrapper if needed, or just keep reference
}

// NewApp creates a new App application struct
func NewApp(rec *recorder.RecorderService, syn *sync.SyncManager, ai *ai.ShapeService, db *db.DBService, mailer *mailer.MailerService) *App {
	return &App{
		recorder: rec,
		sync:     syn,
		ai:       ai,
		db:       db,
		mailer:   mailer,
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// StartRecording wrapper
func (a *App) StartRecording() (string, error) {
	// Generate filename
	timestamp := time.Now().Format("2006-01-02-15-04-05")
	filename := fmt.Sprintf("rec-%s.mp4", timestamp)

	if err := a.recorder.StartRecording(filename); err != nil {
		return "", err
	}
	return filename, nil
}

// StopRecording wrapper
func (a *App) StopRecording() (string, error) {
	if err := a.recorder.StopRecording(); err != nil {
		return "", err
	}
	// Return the saved file path or URL?
	// Return generic success message for now
	return "ok", nil
}

// UploadLesson wrapper
// Takes Base64 data from frontend, saves it, and returns the URL
func (a *App) UploadLesson(filename string, base64Data string) (string, error) {
	// Simple base64 decode
	data, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		return "", fmt.Errorf("base64 decode failed: %v", err)
	}

	// Save and Sync
	url, filePath, err := a.sync.UploadFile(filename, data)
	if err != nil {
		return "", err
	}

	// Trigger Mock Mailer
	students := []string{"student1@test.com", "student2@test.com"}

	// Use filePath for attachment
	go func() {
		if err := a.mailer.SendLessonNotes(filePath, students); err != nil {
			fmt.Printf("Mail error: %v\n", err)
		}
	}()

	return url, nil
}

// DetectShape wrapper
func (a *App) DetectShape(points []map[string]float64) string {
	return a.ai.DetectShape(points)
}
