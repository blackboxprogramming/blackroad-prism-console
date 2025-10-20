package harness

import "time"

// MetricsProvider exposes access to time series backends that can compute
// aggregate rates over a time window.
type MetricsProvider interface {
	// Rate returns a fraction in the range [0, 1] for the supplied selector
	// over the trailing window (now - window, now].
	Rate(selector Selector, window time.Duration) (float64, error)
}

// Selector carries backend-specific query strings that can be interpolated by
// adapters before execution.
type Selector struct {
	PromQL string
	CHSQL  string
}
