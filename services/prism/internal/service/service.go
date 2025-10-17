package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"math"
	"time"
)

// ErrNilDB is returned when constructing a Service without a database handle.
var ErrNilDB = errors.New("service: db is required")

// ErrInvalidNumber is returned when MiniInfer receives a NaN or infinite operand.
var ErrInvalidNumber = errors.New("service: operands must be finite numbers")

// Service coordinates the Prism console domain primitives.
type Service struct {
	db  *sql.DB
	now func() time.Time
}

// Option mutates the service configuration during construction.
type Option func(*Service)

// WithClock overrides the clock used for timestamping persisted records.
func WithClock(now func() time.Time) Option {
	return func(s *Service) {
		if now != nil {
			s.now = now
		}
	}
}

// New constructs a Service bound to the provided database handle.
func New(db *sql.DB, opts ...Option) (*Service, error) {
	if db == nil {
		return nil, ErrNilDB
	}
	svc := &Service{
		db:  db,
		now: func() time.Time { return time.Now().UTC() },
	}
	for _, opt := range opts {
		opt(svc)
	}
	if err := svc.ensureSchema(context.Background()); err != nil {
		return nil, fmt.Errorf("service: ensure schema: %w", err)
	}
	return svc, nil
}

// Health describes the health status returned by the service.
type Health struct {
	Status  string    `json:"status"`
	Service string    `json:"service"`
	Time    time.Time `json:"time"`
}

// Health reports the service health after pinging the database.
func (s *Service) Health(ctx context.Context) (Health, error) {
	if err := s.db.PingContext(ctx); err != nil {
		return Health{}, fmt.Errorf("service: health ping: %w", err)
	}
	return Health{
		Status:  "ok",
		Service: "prism-service",
		Time:    s.now(),
	}, nil
}

// EchoResult mirrors the body received via the Echo endpoint.
type EchoResult struct {
	OK       bool        `json:"ok"`
	Received interface{} `json:"received"`
}

// Echo returns the payload provided by callers, mirroring the Node API contract.
func (s *Service) Echo(_ context.Context, payload interface{}) EchoResult {
	return EchoResult{OK: true, Received: payload}
}

// MiniInferResult represents the multiplication result used by the mini inference flow.
type MiniInferResult struct {
	Output float64 `json:"output"`
}

// MiniInfer multiplies the provided operands and records the invocation.
func (s *Service) MiniInfer(ctx context.Context, x, y float64) (MiniInferResult, error) {
	if math.IsNaN(x) || math.IsNaN(y) || math.IsInf(x, 0) || math.IsInf(y, 0) {
		return MiniInferResult{}, ErrInvalidNumber
	}
	output := x * y
	if _, err := s.db.ExecContext(
		ctx,
		`INSERT INTO mini_infer_requests (x, y, output, created_at) VALUES (?, ?, ?, ?)`,
		x, y, output, s.now(),
	); err != nil {
		return MiniInferResult{}, fmt.Errorf("service: record mini infer: %w", err)
	}
	return MiniInferResult{Output: output}, nil
}

func (s *Service) ensureSchema(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, `
        CREATE TABLE IF NOT EXISTS mini_infer_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            x REAL NOT NULL,
            y REAL NOT NULL,
            output REAL NOT NULL,
            created_at TIMESTAMP NOT NULL
        )
    `)
	return err
}
