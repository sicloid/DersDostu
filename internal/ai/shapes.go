package ai

import "log"

type ShapeService struct {
}

func NewShapeService() *ShapeService {
	return &ShapeService{}
}

// DetectShape analyzes a set of points and returns the shape name
// For MVP, this uses heuristics. Future: ONNX.
func (s *ShapeService) DetectShape(points []map[string]float64) string {
	log.Printf("Analyzing %d points for shape detection...", len(points))
	// TODO: Implement heuristic logic
	return "unknown"
}
