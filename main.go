package main

import (
	"context"
	"embed"
	"log"

	//"os"

	"DersDostu/internal/ai"
	"DersDostu/internal/db"
	"DersDostu/internal/mailer"
	"DersDostu/internal/recorder"
	"DersDostu/internal/server"
	"DersDostu/internal/speech"
	"DersDostu/internal/storage" // Import storage package
	"DersDostu/internal/sync"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// 0. Initialize Storage (Filesystem Manager)
	storageMgr, err := storage.NewStorageManager()
	if err != nil {
		log.Fatal("Failed to initialize storage:", err)
	}

	// 1. Initialize Services
	// 1. Initialize Services
	recService := recorder.NewRecorderService(storageMgr.PublicDir)
	syncManager := sync.NewSyncManager(storageMgr.PublicDir)
	aiService := ai.NewShapeService()
	mailerService := mailer.NewMailerService()
	speechService := speech.NewSpeechService()

	// DB: Use path from storage manager
	dbService, err := db.NewDBService(storageMgr.DBPath)
	if err != nil {
		log.Printf("Warning: Failed to init DB: %v", err)
	}

	// 2. Start Local File Server (bg)
	// Serve the 'public' folder from our data directory
	go server.Start(storageMgr.PublicDir)

	// Create an instance of the app structure
	app := NewApp(recService, syncManager, aiService, dbService, mailerService)

	// Create application with options
	err = wails.Run(&options.App{
		Title:  "DersDostu",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup: func(ctx context.Context) {
			app.startup(ctx)
			speechService.Startup(ctx)
		},
		OnShutdown: func(ctx context.Context) {
			speechService.Shutdown()
		},
		Bind: []interface{}{
			app,
			speechService,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
