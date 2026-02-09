package mailer

import (
	"fmt"
	"time"
)

type MailerService struct {
	// In future: SMTP config
}

func NewMailerService() *MailerService {
	return &MailerService{}
}

// SendLessonNotes simulates sending emails to a list of students
func (m *MailerService) SendLessonNotes(pdfPath string, studentEmails []string) error {
	// Mock: Print to console
	fmt.Printf("[Mailer] Starting bulk email dispatch for file: %s\n", pdfPath)

	// Simulate concurrency
	done := make(chan bool)

	// Launch a goroutine for the bulk batch
	go func() {
		// Mock delay for UI progress bar visualization
		for i, email := range studentEmails {
			// Simulate network latency per email or batch
			time.Sleep(100 * time.Millisecond)
			fmt.Printf("[Mailer] Simulating email to %s... [Success] (%d/%d)\n", email, i+1, len(studentEmails))
		}
		fmt.Println("[Mailer] All emails dispatched successfully.")
		done <- true
	}()

	// In a real app, we might return immediately and let it run in BG,
	// or wait if we want to confirm initiation.
	// For this synchronous Wails call, let's wait a bit or just return success if the process started.
	// But the user UI wants "Sending..." progress.
	// If we return immediately, UI might finish too fast.
	// Let's wait for the simulation to finish for this MVPs visual effect.
	<-done

	return nil
}
