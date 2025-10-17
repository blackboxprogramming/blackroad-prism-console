package usage

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"
)

// ExecerContext defines the subset of *sql.DB and *sql.Tx we rely on for inserts.
type ExecerContext interface {
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
}

// Outcome represents the coarse-grained result of a usage event.
type Outcome string

const (
	OutcomeOK    Outcome = "ok"
	OutcomeWarn  Outcome = "warn"
	OutcomeError Outcome = "error"
)

// Event captures the normalized telemetry payload that will be inserted into usage_events.
type Event struct {
	Timestamp    time.Time
	OrgID        int64
	UserID       int64
	Feature      string
	Tool         string
	Count        int
	Latency      *time.Duration
	Outcome      Outcome
	SamplingRate float64
}

// NewEvent constructs an Event with sensible defaults for optional fields.
func NewEvent(orgID, userID int64, feature, tool string, ok bool) Event {
	outcome := OutcomeError
	if ok {
		outcome = OutcomeOK
	}

	return Event{
		Timestamp:    time.Now().UTC(),
		OrgID:        orgID,
		UserID:       userID,
		Feature:      feature,
		Tool:         tool,
		Count:        1,
		Outcome:      outcome,
		SamplingRate: 1.0,
	}
}

// Normalize ensures defaults are populated before validation/execution.
func (e *Event) Normalize() {
	if e.Timestamp.IsZero() {
		e.Timestamp = time.Now().UTC()
	}
	if e.Count == 0 {
		e.Count = 1
	}
	if e.SamplingRate == 0 {
		e.SamplingRate = 1.0
	}
	if e.Outcome == "" {
		e.Outcome = OutcomeOK
	}
}

// Validate guards against malformed events that would violate persistence constraints.
func (e Event) Validate() error {
	if e.OrgID == 0 {
		return errors.New("usage: org id is required")
	}
	if e.UserID == 0 {
		return errors.New("usage: user id is required")
	}
	if e.Feature == "" {
		return errors.New("usage: feature is required")
	}
	if e.Tool == "" {
		return errors.New("usage: tool is required")
	}
	if e.Count < 0 {
		return fmt.Errorf("usage: count must be non-negative, got %d", e.Count)
	}
	if e.SamplingRate <= 0 {
		return fmt.Errorf("usage: sampling rate must be positive, got %f", e.SamplingRate)
	}
	switch e.Outcome {
	case OutcomeOK, OutcomeWarn, OutcomeError:
	default:
		return fmt.Errorf("usage: unsupported outcome %q", e.Outcome)
	}
	return nil
}

// TrackUsage persists a single usage Events row.
func TrackUsage(ctx context.Context, exec ExecerContext, event Event) error {
	event.Normalize()
	if err := event.Validate(); err != nil {
		return err
	}

	var latency any
	if event.Latency != nil {
		ms := int(event.Latency.Round(time.Millisecond) / time.Millisecond)
		latency = ms
	} else {
		latency = nil
	}

	_, err := exec.ExecContext(ctx, `
        INSERT INTO usage_events (
            ts, org_id, user_id, feature, tool, count, latency_ms, outcome, sampling_rate
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
		event.Timestamp,
		event.OrgID,
		event.UserID,
		event.Feature,
		event.Tool,
		event.Count,
		latency,
		string(event.Outcome),
		event.SamplingRate,
	)
	return err
}

// TrackBatch inserts many usage events using a shared transaction-like context.
func TrackBatch(ctx context.Context, exec ExecerContext, events []Event) error {
	for idx, evt := range events {
		if err := TrackUsage(ctx, exec, evt); err != nil {
			return fmt.Errorf("usage: insert failed for index %d: %w", idx, err)
		}
	}
	return nil
}
