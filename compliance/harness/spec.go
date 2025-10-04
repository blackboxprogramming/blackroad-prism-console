package harness

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"sort"
	"strings"

	"gopkg.in/yaml.v3"
)

// RuleSpec captures the superset of attributes supported by policy rule YAML.
type RuleSpec struct {
	RuleID          string            `yaml:"rule_id"`
	LegacyID        string            `yaml:"id"`
	Name            string            `yaml:"name"`
	Category        string            `yaml:"category"`
	Mode            string            `yaml:"mode"`
	Canary          bool              `yaml:"canary"`
	Severity        string            `yaml:"severity"`
	Version         int               `yaml:"version"`
	Description     string            `yaml:"description"`
	Metadata        map[string]any    `yaml:"metadata"`
	InputsSchema    []InputField      `yaml:"inputs_schema"`
	OutputType      string            `yaml:"output_type"`
	Expr            string            `yaml:"expr"`
	MetricsSelector map[string]string `yaml:"metrics_selector"`
	OnMatch         DecisionBlock     `yaml:"on_match"`
	Notify          NotifyBlock       `yaml:"notify"`
	Owners          []string          `yaml:"owners"`
	DocsURL         string            `yaml:"docs_url"`
	Tests           []RuleTest        `yaml:"tests"`
	Comments        []string          `yaml:"comments"`

	Source string `yaml:"-"`
}

// InputField documents an individual attribute required by the rule.
type InputField struct {
	Name        string `yaml:"name"`
	Type        string `yaml:"type"`
	Description string `yaml:"description"`
}

// DecisionBlock describes the decision emitted when a rule matches.
type DecisionBlock struct {
	Decision string            `yaml:"decision"`
	Reason   string            `yaml:"reason"`
	Details  map[string]string `yaml:"details"`
}

// NotifyBlock describes downstream notification hooks for the rule.
type NotifyBlock struct {
	Channels []string `yaml:"channels"`
}

// RuleTest models a single test case as defined in the YAML file.
type RuleTest struct {
	Name    string         `yaml:"name"`
	GUID    string         `yaml:"guid"`
	Fixture string         `yaml:"fixture"`
	Window  string         `yaml:"window"`
	Series  any            `yaml:"series"`
	Input   map[string]any `yaml:"input"`
	Want    any            `yaml:"want"`
}

// LoadRuleYAML parses a rule specification from disk and performs normalization
// so downstream tooling can operate on both legacy and modern schemas.
func LoadRuleYAML(path string) (*RuleSpec, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("load rule: %w", err)
	}

	var spec RuleSpec
	if err := yaml.Unmarshal(data, &spec); err != nil {
		return nil, fmt.Errorf("parse rule yaml: %w", err)
	}

	spec.Source = path
	spec.normalize()
	return &spec, nil
}

func (r *RuleSpec) normalize() {
	if r.RuleID == "" {
		r.RuleID = r.LegacyID
	}
	if r.Name == "" {
		if summary, ok := r.MetadataValue("summary").(string); ok {
			r.Name = summary
		} else if desc, ok := r.MetadataValue("description").(string); ok {
			r.Name = desc
		} else if r.RuleID != "" {
			r.Name = r.RuleID
		}
	}
	if r.Category == "" {
		if r.Mode != "" {
			r.Category = strings.ToLower(r.Mode)
		} else if r.OnMatch.Decision != "" {
			r.Category = "enforce"
		}
	}
	if r.Description == "" {
		if desc, ok := r.MetadataValue("description").(string); ok {
			r.Description = desc
		}
	}
	if r.Severity == "" {
		if sev, ok := r.MetadataValue("severity").(string); ok {
			r.Severity = sev
		}
	}
	if r.Version == 0 {
		switch v := r.MetadataValue("version").(type) {
		case int:
			if v > 0 {
				r.Version = v
			}
		case int64:
			if v > 0 {
				r.Version = int(v)
			}
		case float64:
			if v > 0 {
				r.Version = int(v)
			}
		}
		if r.Version == 0 {
			r.Version = 1
		}
	}
	r.Severity = strings.ToLower(r.Severity)
	if r.Category != "" {
		r.Category = strings.ToLower(r.Category)
	}
	if r.OnMatch.Decision == "" {
		switch strings.ToLower(r.Mode) {
		case "enforce":
			r.OnMatch.Decision = "deny"
		case "observe":
			r.OnMatch.Decision = "notify"
		}
	}
	if len(r.Owners) == 0 {
		if owners, ok := r.MetadataValue("owners").([]any); ok {
			extracted := make([]string, 0, len(owners))
			for _, raw := range owners {
				if s, ok := raw.(string); ok {
					extracted = append(extracted, s)
				}
			}
			r.Owners = extracted
		}
	}
}

// MetadataValue fetches a metadata attribute defensively.
func (r *RuleSpec) MetadataValue(key string) any {
	if r.Metadata == nil {
		return nil
	}
	return r.Metadata[key]
}

// SortedMetricKeys returns a stable ordering of metrics selector keys to ease
// deterministic template rendering.
func (r *RuleSpec) SortedMetricKeys() []string {
	keys := make([]string, 0, len(r.MetricsSelector))
	for k := range r.MetricsSelector {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}

// ToJSON renders the provided value as pretty JSON with HTML escaping disabled
// so it can be embedded directly into Markdown templates.
func ToJSON(v any) string {
	if v == nil {
		return "{}"
	}
	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	enc.SetIndent("", "  ")
	if err := enc.Encode(v); err != nil {
		return "{}"
	}
	return strings.TrimSpace(buf.String())
}
