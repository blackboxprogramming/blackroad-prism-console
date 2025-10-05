package harness

import (
	"sync"
	"time"
)

type timedEvent struct {
	t  time.Time
	ev Event
}

// WindowStore keeps a sliding window of events. It is safe for concurrent use.
type WindowStore struct {
	mu   sync.RWMutex
	evs  []timedEvent
	head int
	size int
	cap  int
}

// NewWindowStore constructs a store with the provided capacity.
func NewWindowStore(capacity int) *WindowStore {
	if capacity <= 0 {
		capacity = 1
	}
	return &WindowStore{
		cap: capacity,
		evs: make([]timedEvent, capacity),
	}
}

// Append adds an event with a timestamp to the store. The event is normalised
// to ensure consistent map ownership.
func (w *WindowStore) Append(ts time.Time, ev Event) {
	w.mu.Lock()
	defer w.mu.Unlock()

	w.evs[w.head] = timedEvent{t: ts, ev: NormalizeEvent(ev)}
	w.head = (w.head + 1) % w.cap
	if w.size < w.cap {
		w.size++
	}
}

// Snapshot returns events newer than now-window in chronological order.
func (w *WindowStore) Snapshot(window time.Duration, now time.Time) []Event {
	cut := now.Add(-window)

	w.mu.RLock()
	defer w.mu.RUnlock()

	if w.size == 0 {
		return nil
	}

	out := make([]Event, 0, w.size)
	for i := 0; i < w.size; i++ {
		idx := (w.head - 1 - i + w.cap) % w.cap
		te := w.evs[idx]
		if te.t.After(cut) {
			out = append(out, te.ev)
		} else {
			break
		}
	}

	// reverse to chronological order
	for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
		out[i], out[j] = out[j], out[i]
	}

	return CloneEvents(out)
}

// Rate computes (#matching / #total) within the provided window using the
// supplied predicate. The predicate should be free of side effects.
func (w *WindowStore) Rate(window time.Duration, now time.Time, pred func(Event) bool) float64 {
	evs := w.Snapshot(window, now)
	if len(evs) == 0 {
		return 0
	}

	match := 0
	for _, ev := range evs {
		if pred(ev) {
			match++
		}
	}

	return float64(match) / float64(len(evs))
}
