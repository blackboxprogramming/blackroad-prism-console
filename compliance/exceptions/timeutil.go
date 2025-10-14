package exceptions

import (
	"fmt"
	"time"
)

func parseTimeValue(v any) (*time.Time, error) {
	if v == nil {
		return nil, nil
	}
	switch val := v.(type) {
	case time.Time:
		t := val.UTC()
		return &t, nil
	case string:
		return parseTimeString(val)
	case []byte:
		return parseTimeString(string(val))
	}
	return nil, fmt.Errorf("exceptions: unsupported time type %T", v)
}

func parseTimeString(raw string) (*time.Time, error) {
	if raw == "" {
		return nil, nil
	}
	layouts := []string{
		time.RFC3339Nano,
		time.RFC3339,
		"2006-01-02 15:04:05",
		"2006-01-02 15:04:05Z07:00",
	}
	for _, layout := range layouts {
		if ts, err := time.Parse(layout, raw); err == nil {
			t := ts.UTC()
			return &t, nil
		}
	}
	return nil, fmt.Errorf("exceptions: parse time %q", raw)
}
