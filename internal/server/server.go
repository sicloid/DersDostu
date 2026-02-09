package server

import (
	"log"

	"github.com/gofiber/fiber/v2"
)

// Start executes the Fiber web server on port 8080
// It serves files from the local data directory for LAN access.
func Start(dataDir string) {
	app := fiber.New()

	// Serve static files from the data directory
	// In production, this would be C:\DersDostu_Data\public
	app.Static("/", dataDir)

	log.Println("Local File Server starting on :8080")
	if err := app.Listen(":8080"); err != nil {
		log.Printf("Error starting local server: %v", err)
	}
}
