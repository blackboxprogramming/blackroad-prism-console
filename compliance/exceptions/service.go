package exceptions

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"
)

// PlaceholderFunc produces a dialect-specific placeholder for the nth parameter.
type PlaceholderFunc func(n int) string

// SlackPoster posts a message payload to Slack and returns metadata for the posted message.
type SlackPoster interface {
	PostMessage(ctx context.Context, payload map[string]any) (SlackMessageResponse, error)
}

// SlackMessageResponse captures the minimal subset of Slack's chat.postMessage response
// that we care about for threading reminders and follow-ups.
type SlackMessageResponse struct {
	Channel   string
	Timestamp string
}

// Logger is the minimal logging interface used by the service for observability hooks.
type Logger interface {
	Printf(format string, args ...any)
}

// Service coordinates reminder scheduling, Slack notifications, and read APIs for exceptions.
type Service struct {
	DB             *sql.DB
	Slack          SlackPoster
	DefaultChannel string
	Placeholder    PlaceholderFunc
	Logger         Logger
	Now            func() time.Time
}

// Option mutates a Service instance during construction.
type Option func(*Service)

// WithDefaultChannel overrides the Slack channel fallback used for reminders.
func WithDefaultChannel(ch string) Option {
	return func(s *Service) {
		if ch != "" {
			s.DefaultChannel = ch
		}
	}
}

// WithPlaceholder configures the SQL placeholder function (defaults to question marks).
func WithPlaceholder(fn PlaceholderFunc) Option {
	return func(s *Service) {
		if fn != nil {
			s.Placeholder = fn
		}
	}
}

// WithLogger installs a structured logger.
func WithLogger(l Logger) Option {
	return func(s *Service) {
		s.Logger = l
	}
}

// WithClock overrides the clock used for deterministic testing.
func WithClock(now func() time.Time) Option {
	return func(s *Service) {
		if now != nil {
			s.Now = now
		}
	}
}

// NewService constructs a Service bound to the provided dependencies.
func NewService(db *sql.DB, slack SlackPoster, opts ...Option) (*Service, error) {
	if db == nil {
		return nil, errors.New("exceptions: db is required")
	}
	if slack == nil {
		return nil, errors.New("exceptions: slack poster is required")
	}
	svc := &Service{
		DB:             db,
		Slack:          slack,
		DefaultChannel: "#secops",
		Placeholder: func(int) string {
			return "?"
		},
		Now: time.Now,
	}
	for _, opt := range opts {
		opt(svc)
	}
	return svc, nil
}

func (s *Service) logf(format string, args ...any) {
	if s.Logger != nil {
		s.Logger.Printf(format, args...)
	}
}

func (s *Service) placeholder(idx int) string {
	if s.Placeholder == nil {
		return "?"
	}
	return s.Placeholder(idx)
}

func (s *Service) now() time.Time {
	if s.Now != nil {
		return s.Now()
	}
	return time.Now()
}

// PostApprovalCard sends the approval card to Slack and records the thread metadata on success.
func (s *Service) PostApprovalCard(ctx context.Context, exceptionID int64, card map[string]any) (SlackMessageResponse, error) {
	if card == nil {
		return SlackMessageResponse{}, errors.New("exceptions: card payload is required")
	}
	resp, err := s.Slack.PostMessage(ctx, card)
	if err != nil {
		return SlackMessageResponse{}, err
	}
	if resp.Channel == "" && resp.Timestamp == "" {
		return resp, nil
	}
	query := fmt.Sprintf(
		"UPDATE exceptions SET slack_channel=%s, slack_ts=%s WHERE id=%s",
		s.placeholder(1), s.placeholder(2), s.placeholder(3),
	)
	if _, err := s.DB.ExecContext(ctx, query, resp.Channel, resp.Timestamp, exceptionID); err != nil {
		return resp, fmt.Errorf("exceptions: record slack thread: %w", err)
	}
	return resp, nil
}
