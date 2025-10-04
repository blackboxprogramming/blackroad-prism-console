package harness

import (
	"sync"
	"time"
)

// TimedEvent tracks an individual event and the timestamp used for window
// calculations. The event payload is stored as a shallow copy of the input map
// to avoid accidental mutation by callers after insertion.
type TimedEvent struct {
	Timestamp time.Time
	Fields    map[string]any
}

// WindowStore provides a minimal in-memory buffer of recent events for helper
// functions such as distinct_over(). It is deliberately simple for harness
// usage and does not implement eviction beyond the Snapshot window filter.
type WindowStore struct {
	mu     sync.RWMutex
	events []TimedEvent
}

// NewWindowStore creates an empty store ready for event ingestion.
func NewWindowStore() *WindowStore {
	return &WindowStore{}
}

// Add records an event at the provided timestamp. Callers are responsible for
// supplying timestamps in UTC to keep comparisons consistent.
func (s *WindowStore) Add(ts time.Time, event map[string]any) {
	s.mu.Lock()
	defer s.mu.Unlock()

	clone := make(map[string]any, len(event))
	for k, v := range event {
		clone[k] = v
	}

	s.events = append(s.events, TimedEvent{Timestamp: ts, Fields: clone})
}

// Snapshot returns all events that fall within the provided rolling window
// ending at the supplied reference time.
func (s *WindowStore) Snapshot(window time.Duration, now time.Time) []map[string]any {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if window < 0 {
		window = 0
	}

	cutoff := now.Add(-window)
	results := make([]map[string]any, 0, len(s.events))
	for _, event := range s.events {
		if event.Timestamp.Before(cutoff) {
			continue
		}
		clone := make(map[string]any, len(event.Fields))
		for k, v := range event.Fields {
			clone[k] = v
		}
		results = append(results, clone)
	}

	return results
}
