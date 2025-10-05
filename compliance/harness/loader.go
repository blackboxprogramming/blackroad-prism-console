package harness

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

type OnMatch struct {
	Decision string         `yaml:"decision"`
	Reason   string         `yaml:"reason"`
	Details  map[string]any `yaml:"details"`
}

type NotifySpec struct {
	Channels  []string       `yaml:"channels"`
	Ticketing map[string]any `yaml:"ticketing"`
}

type Series struct {
	Window string           `yaml:"window"`
	Events []map[string]any `yaml:"series"`
}

type TestCase struct {
	Name          string         `yaml:"name"`
	GUID          string         `yaml:"guid"`
	Input         map[string]any `yaml:"input"`
	Series        *Series        `yaml:"series"`
	Fixture       string         `yaml:"fixture"`
	Window        string         `yaml:"window"`
	Want          any            `yaml:"want"`
	ExpectDetails map[string]any `yaml:"expect_details"`
}

type RuleYAML struct {
	RuleID         string           `yaml:"rule_id"`
	LegacyID       string           `yaml:"id"`
	Name           string           `yaml:"name"`
	Category       string           `yaml:"category"`
	Mode           string           `yaml:"mode"`
	Severity       string           `yaml:"severity"`
	Version        int              `yaml:"version"`
	Description    string           `yaml:"description"`
	InputsSchema   []map[string]any `yaml:"inputs_schema"`
	OutputType     string           `yaml:"output_type"`
	OutputContract any              `yaml:"output_contract"`
	Expr           string           `yaml:"expr"`
	OnMatch        OnMatch          `yaml:"on_match"`
	Notify         NotifySpec       `yaml:"notify"`
	Tests          []TestCase       `yaml:"tests"`
	Comments       []string         `yaml:"comments"`
}

func LoadRuleYAML(path string) (RuleYAML, error) {
	var spec RuleYAML
	b, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			alt := filepath.Join("..", path)
			if bAlt, readErr := os.ReadFile(alt); readErr == nil {
				b = bAlt
			} else {
				return spec, fmt.Errorf("read rule yaml: %w", err)
			}
		} else {
			return spec, fmt.Errorf("read rule yaml: %w", err)
		}
	}
	if err := yaml.Unmarshal(b, &spec); err != nil {
		return spec, fmt.Errorf("parse rule yaml: %w", err)
	}

	if spec.RuleID == "" {
		spec.RuleID = spec.LegacyID
	}
	if spec.Category == "" {
		spec.Category = spec.Mode
	}
	if spec.OnMatch.Details == nil {
		spec.OnMatch.Details = map[string]any{}
	}
	if spec.OnMatch.Decision == "" {
		if spec.Category == "enforce" {
			spec.OnMatch.Decision = "deny"
		} else {
			spec.OnMatch.Decision = "notify"
		}
	}
	if spec.OnMatch.Reason == "" {
		spec.OnMatch.Reason = spec.RuleID
	}

	return spec, nil
}
