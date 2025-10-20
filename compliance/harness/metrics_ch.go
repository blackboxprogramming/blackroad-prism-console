package harness

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/ClickHouse/clickhouse-go/v2"
)

// CHProvider executes SQL queries against a ClickHouse cluster.
type CHProvider struct {
	Conn clickhouse.Conn
}

// NewCH constructs a ClickHouse provider using the DSN stored in CH_DSN.
func NewCH() (*CHProvider, error) {
	dsn := os.Getenv("CH_DSN")
	if dsn == "" {
		return nil, errors.New("clickhouse dsn not set")
	}
	opts, err := clickhouse.ParseDSN(dsn)
	if err != nil {
		return nil, fmt.Errorf("clickhouse parse dsn: %w", err)
	}
	conn, err := clickhouse.Open(opts)
	if err != nil {
		return nil, fmt.Errorf("clickhouse open: %w", err)
	}
	return &CHProvider{Conn: conn}, nil
}

// Rate evaluates the supplied selector against ClickHouse and clamps the result.
func (c *CHProvider) Rate(sel Selector, window time.Duration) (float64, error) {
	if c == nil {
		return 0, errors.New("clickhouse provider is nil")
	}
	if c.Conn == nil {
		return 0, errors.New("clickhouse connection is nil")
	}
	if sel.CHSQL == "" {
		return 0, fmt.Errorf("clickhouse selector is empty")
	}

	query := strings.ReplaceAll(sel.CHSQL, "{{window}}", chWindow(window))
	var value float64
	if err := c.Conn.QueryRow(context.Background(), query).Scan(&value); err != nil {
		return 0, fmt.Errorf("clickhouse query: %w", err)
	}
	if value < 0 {
		value = 0
	}
	if value > 1 {
		value = 1
	}
	return value, nil
}

func chWindow(d time.Duration) string {
	seconds := int(d.Seconds())
	switch {
	case seconds%3600 == 0:
		return fmt.Sprintf("%d HOUR", seconds/3600)
	case seconds%60 == 0:
		return fmt.Sprintf("%d MINUTE", seconds/60)
	default:
		return fmt.Sprintf("%d SECOND", seconds)
	}
}
