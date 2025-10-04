package harness

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

// PromProvider executes PromQL queries against a remote Prometheus instance.
type PromProvider struct {
	BaseURL string
	Client  *http.Client
	Now     func() time.Time
}

// NewProm constructs a Prometheus provider using PROM_URL for configuration.
func NewProm() *PromProvider {
	return &PromProvider{
		BaseURL: os.Getenv("PROM_URL"),
		Client:  &http.Client{Timeout: 5 * time.Second},
		Now: func() time.Time {
			return time.Now().UTC()
		},
	}
}

// Rate evaluates the supplied selector using the Prometheus HTTP query API.
func (p *PromProvider) Rate(sel Selector, window time.Duration) (float64, error) {
	if p == nil {
		return 0, errors.New("prom provider is nil")
	}
	if p.BaseURL == "" {
		return 0, fmt.Errorf("prom base url not set")
	}
	if sel.PromQL == "" {
		return 0, fmt.Errorf("prom selector is empty")
	}

	q := strings.ReplaceAll(sel.PromQL, "{{window}}", promWindow(window))
	endpoint, err := url.Parse(p.BaseURL)
	if err != nil {
		return 0, fmt.Errorf("prom url parse: %w", err)
	}
	query := endpoint.Query()
	query.Set("query", q)
	endpoint.RawQuery = query.Encode()

	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, endpoint.String(), nil)
	if err != nil {
		return 0, fmt.Errorf("prom request: %w", err)
	}

	resp, err := p.Client.Do(req)
	if err != nil {
		return 0, fmt.Errorf("prom request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("prom query failed: %s", resp.Status)
	}

	var out struct {
		Status string `json:"status"`
		Data   struct {
			ResultType string `json:"resultType"`
			Result     []struct {
				Value [2]any `json:"value"`
			} `json:"result"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return 0, fmt.Errorf("prom decode: %w", err)
	}
	if out.Status != "success" || len(out.Data.Result) == 0 {
		return 0, nil
	}

	valStr, _ := out.Data.Result[0].Value[1].(string)
	if valStr == "" {
		return 0, nil
	}
	r, err := strconv.ParseFloat(valStr, 64)
	if err != nil {
		return 0, fmt.Errorf("prom parse: %w", err)
	}
	if r < 0 {
		r = 0
	}
	if r > 1 {
		r = 1
	}
	return r, nil
}

func promWindow(d time.Duration) string {
	seconds := int(d.Seconds())
	switch {
	case seconds%3600 == 0:
		return fmt.Sprintf("%dh", seconds/3600)
	case seconds%60 == 0:
		return fmt.Sprintf("%dm", seconds/60)
	default:
		return fmt.Sprintf("%ds", seconds)
	}
}
