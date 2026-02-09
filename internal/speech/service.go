package speech

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"

	vosk "github.com/alphacep/vosk-api/go"
	"github.com/gordonklaus/portaudio"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// VoskResult represents the JSON result from Vosk
type VoskResult struct {
	Text string `json:"text"`
}

// VoskPartialResult represents partial recognition results
type VoskPartialResult struct {
	Partial string `json:"partial"`
}

// SpeechService handles offline speech recognition using Vosk
type SpeechService struct {
	ctx         context.Context
	isListening bool
	mu          sync.Mutex
	wg          sync.WaitGroup
	model       *vosk.VoskModel
	recognizer  *vosk.VoskRecognizer
	stream      *portaudio.Stream
	buffer      []int16 // Shared buffer for persistent stream
	stopChan    chan bool
}

// NewSpeechService creates a new speech service instance
func NewSpeechService() *SpeechService {
	return &SpeechService{
		isListening: false,
		stopChan:    make(chan bool, 1), // Buffered to prevent blocking
	}
}

// Startup initializes the service and loads the Vosk model
func (s *SpeechService) Startup(ctx context.Context) {
	s.ctx = ctx
	log.Println("🎤 SpeechService starting up...")

	// Initialize PortAudio ONCE on startup
	if err := portaudio.Initialize(); err != nil {
		log.Printf("⚠️ Failed to initialize PortAudio: %v", err)
	}

	// Load Vosk model
	modelPath := "./models/vosk-model-small-tr-0.3"
	if err := s.LoadModel(modelPath); err != nil {
		log.Printf("⚠️ Failed to load Vosk model: %v", err)
		log.Println("📥 Model should be at: ./models/vosk-model-small-tr-0.3")
		return
	}

	log.Println("✅ SpeechService ready - Vosk and PortAudio loaded")
}

// LoadModel loads the Vosk language model
func (s *SpeechService) LoadModel(modelPath string) error {
	log.Printf("📂 Loading model from: %s", modelPath)

	model, err := vosk.NewModel(modelPath)
	if err != nil {
		return fmt.Errorf("failed to load model: %w", err)
	}

	s.model = model
	log.Println("✅ Vosk model loaded successfully")
	return nil
}

// StartDictation starts listening to microphone and transcribing
func (s *SpeechService) StartDictation() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.isListening {
		return fmt.Errorf("already listening")
	}

	if s.model == nil {
		return fmt.Errorf("model not loaded - check logs")
	}

	log.Println("🎤 Starting dictation...")

	// Create recognizer (16kHz sample rate)
	var err error
	if s.recognizer == nil {
		s.recognizer, err = vosk.NewRecognizer(s.model, 16000.0)
		if err != nil {
			return fmt.Errorf("failed to create recognizer: %w", err)
		}
		s.recognizer.SetWords(1)
	}

	// Lazy init persistent stream
	if s.stream == nil {
		const sampleRate = 16000
		const framesPerBuffer = 1600
		s.buffer = make([]int16, framesPerBuffer)

		log.Println("🎙️ Opening persistent microphone stream...")
		s.stream, err = portaudio.OpenDefaultStream(1, 0, sampleRate, framesPerBuffer, s.buffer)
		if err != nil {
			return fmt.Errorf("failed to open stream: %w", err)
		}
	}

	// Start (or resume) stream
	if err := s.stream.Start(); err != nil {
		log.Printf("⚠️ Stream start error (attempting re-open): %v", err)
		s.stream.Close()
		s.stream = nil
		// Re-attempt open once
		s.stream, err = portaudio.OpenDefaultStream(1, 0, 16000, 1600, s.buffer)
		if err != nil {
			return fmt.Errorf("failed to re-open stream: %w", err)
		}
		if err := s.stream.Start(); err != nil {
			return fmt.Errorf("fatal stream start failure: %w", err)
		}
	}

	// Drain stop channel
	select {
	case <-s.stopChan:
		log.Println("🧹 Drained stale stop signal")
	default:
	}

	s.isListening = true
	s.wg.Add(1)
	go s.processAudio(s.buffer)

	log.Println("✅ Dictation started - speak now!")
	runtime.EventsEmit(s.ctx, "speech-started", true)

	return nil
}

// StopDictation stops the data flow but keeps the stream open for reuse
func (s *SpeechService) StopDictation() error {
	s.mu.Lock()
	if !s.isListening {
		s.mu.Unlock()
		return nil
	}

	log.Println("🛑 Stopping dictation data flow...")
	s.isListening = false

	select {
	case s.stopChan <- true:
	default:
	}

	// Only STOP the stream, do not close it (prevents ALSA descriptor issues)
	if s.stream != nil {
		s.stream.Stop()
	}
	s.mu.Unlock()

	s.wg.Wait()

	// Keep recognizer alive for reuse or free and recreate
	// Let's recreate recognizer to avoid buffer accumulation between sessions
	s.mu.Lock()
	if s.recognizer != nil {
		s.recognizer.Free()
		s.recognizer = nil
	}
	s.mu.Unlock()

	if s.ctx != nil {
		runtime.EventsEmit(s.ctx, "speech-stopped", true)
	}

	log.Println("✅ Dictation data flow stopped (Stream reserved)")
	return nil
}

// Shutdown releases all hardware resources (call on app exit)
func (s *SpeechService) Shutdown() {
	s.mu.Lock()
	log.Println("🤫 SpeechService shutting down...")
	s.isListening = false
	s.mu.Unlock()

	// Wait for any active processing to stop
	s.wg.Wait()

	s.mu.Lock()
	defer s.mu.Unlock()

	if s.stream != nil {
		s.stream.Stop()
		s.stream.Close()
		s.stream = nil
	}

	if s.recognizer != nil {
		s.recognizer.Free()
		s.recognizer = nil
	}

	if s.model != nil {
		s.model.Free()
		s.model = nil
	}

	portaudio.Terminate()
	log.Println("👋 SpeechService hardware released")
}

// processAudio processes incoming audio stream
func (s *SpeechService) processAudio(buffer []int16) {
	defer s.wg.Done()

	for {
		// Thread-safe check if we should continue
		s.mu.Lock()
		listening := s.isListening
		stream := s.stream
		recognizer := s.recognizer
		s.mu.Unlock()

		if !listening || stream == nil || recognizer == nil {
			log.Println("ℹ️ processAudio: stopping (state mismatch or nil resource)")
			return
		}

		select {
		case <-s.stopChan:
			log.Println("ℹ️ processAudio: received stop signal")
			return
		default:
			// Read audio from microphone
			err := stream.Read()
			if err != nil {
				log.Printf("❌ Stream read error: %v", err)

				// Attempt recovery if it's a "File descriptor in bad state" or similar ALSA error
				if strings.Contains(err.Error(), "bad state") || strings.Contains(err.Error(), "underrun") {
					log.Println("🔄 Attempting ALSA recovery...")
					s.mu.Lock()
					stream.Stop()
					stream.Close()
					s.stream = nil // Trigger re-open on next dictation
					s.isListening = false
					s.mu.Unlock()

					runtime.EventsEmit(s.ctx, "speech-stopped", true)
					return
				}
				return
			}

			// Feed to recognizer (convert int16 buffer to bytes)
			bufBytes := make([]byte, len(buffer)*2)
			for i, sample := range buffer {
				bufBytes[i*2] = byte(sample)
				bufBytes[i*2+1] = byte(sample >> 8)
			}

			s.mu.Lock()
			// Double check recognizer state after blocking Read()
			if s.recognizer != nil {
				if s.recognizer.AcceptWaveform(bufBytes) == 1 {
					// Final result
					resultJSON := s.recognizer.Result()
					s.mu.Unlock() // Unlock before processing result

					var result VoskResult
					if err := json.Unmarshal([]byte(resultJSON), &result); err != nil {
						log.Println("❌ JSON parse error:", err)
						continue
					}

					if result.Text != "" {
						s.handleResult(result.Text)
					}
				} else {
					// Partial result
					partialJSON := s.recognizer.PartialResult()
					s.mu.Unlock() // Unlock before emitting event

					var partial VoskPartialResult
					if err := json.Unmarshal([]byte(partialJSON), &partial); err == nil {
						if partial.Partial != "" {
							runtime.EventsEmit(s.ctx, "speech-partial", partial.Partial)
						}
					}
				}
			} else {
				s.mu.Unlock()
				return
			}
		}
	}
}

// handleResult processes recognized text and checks for voice commands
func (s *SpeechService) handleResult(text string) {
	text = strings.TrimSpace(text)
	if text == "" {
		return
	}

	log.Printf("🎤 Recognized: %s", text)

	// Voice command detection
	lowerText := strings.ToLower(text)
	switch lowerText {
	case "kırmızı kalem", "kirmizi kalem":
		runtime.EventsEmit(s.ctx, "voice-command", map[string]interface{}{
			"action": "tool-change",
			"tool":   "pencil",
			"color":  "#FF0000",
		})
		log.Println("🎨 Command: Red Pencil")

	case "mavi kalem":
		runtime.EventsEmit(s.ctx, "voice-command", map[string]interface{}{
			"action": "tool-change",
			"tool":   "pencil",
			"color":  "#0000FF",
		})
		log.Println("🎨 Command: Blue Pencil")

	case "silgi":
		runtime.EventsEmit(s.ctx, "voice-command", map[string]interface{}{
			"action": "tool-change",
			"tool":   "eraser",
		})
		log.Println("🧹 Command: Eraser")

	case "temizle", "sıfırla":
		runtime.EventsEmit(s.ctx, "voice-command", map[string]interface{}{
			"action": "canvas-clear",
		})
		log.Println("🗑️ Command: Clear Canvas")

	default:
		// Regular text - emit to frontend
		runtime.EventsEmit(s.ctx, "speech-text", text)
	}
}

// IsListening returns current listening state
func (s *SpeechService) IsListening() bool {
	return s.isListening
}
