package harness

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

// RuleYAML mirrors the schema used in the repository's rule definitions.
type RuleYAML struct {
	RuleID          string `yaml:"rule_id"`
	Name            string `yaml:"name"`
	Category        string `yaml:"category"`
	Severity        string `yaml:"severity"`
	Version         int    `yaml:"version"`
	Description     string `yaml:"description"`
	Expr            string `yaml:"expr"`
	MetricsSelector struct {
		Prom string `yaml:"prom"`
		CH   string `yaml:"ch"`
	} `yaml:"metrics_selector"`
	OnMatch OnMatchYAML `yaml:"on_match"`
	Notify  NotifySpec  `yaml:"notify"`
	DocsURL string      `yaml:"docs_url"`
	Owners  []string    `yaml:"owners"`
	Canary  bool        `yaml:"canary"`
}

// OnMatchYAML is a helper struct for YAML decoding.
type OnMatchYAML struct {
	Decision string         `yaml:"decision"`
	Reason   string         `yaml:"reason"`
	Details  map[string]any `yaml:"details"`
}

// LoadRuleYAML reads and unmarshals a rule specification from disk.
func LoadRuleYAML(path string) (RuleYAML, error) {
	raw, err := os.ReadFile(filepath.Clean(path))
	if err != nil {
		return RuleYAML{}, err
	}
	var spec RuleYAML
	if err := yaml.Unmarshal(raw, &spec); err != nil {
		return RuleYAML{}, err
	}
	return spec, nil
}

// CompileFromYAML parses, type-checks, and prepares a rule for execution.
func CompileFromYAML(path string) (CompiledRule, error) {
	spec, err := LoadRuleYAML(path)
	if err != nil {
		return CompiledRule{}, err
	}
	if spec.Expr == "" {
		return CompiledRule{}, fmt.Errorf("rule %s: expr is required", spec.RuleID)
	}

	var provider MetricsProvider
	if os.Getenv("PROM_URL") != "" {
		provider = NewProm()
	} else if os.Getenv("CH_DSN") != "" {
		provider, err = NewCH()
		if err != nil {
			return CompiledRule{}, err
		}
	}

	selectorFor := func(window string) Selector {
		prom := strings.TrimSpace(strings.ReplaceAll(spec.MetricsSelector.Prom, "{{window}}", window))
		ch := strings.TrimSpace(strings.ReplaceAll(spec.MetricsSelector.CH, "{{window}}", window))
		return Selector{PromQL: prom, CHSQL: ch}
	}

	binding := RateBinding{
		Provider:    provider,
		SelectorFor: selectorFor,
	}

	env, opts, err := EnvWithRate(binding)
	if err != nil {
		return CompiledRule{}, err
	}

	ast, iss := env.Parse(spec.Expr)
	if iss.Err() != nil {
		return CompiledRule{}, fmt.Errorf("parse CEL: %w", iss.Err())
	}
	ast, iss = env.Check(ast)
	if iss.Err() != nil {
		return CompiledRule{}, fmt.Errorf("check CEL: %w", iss.Err())
	}
	prg, err := env.Program(ast, opts...)
	if err != nil {
		return CompiledRule{}, fmt.Errorf("program: %w", err)
	}

	compiled := CompiledRule{
		ID:          spec.RuleID,
		Name:        spec.Name,
		Category:    spec.Category,
		Severity:    spec.Severity,
		Expr:        spec.Expr,
		Program:     prg,
		Notify:      spec.Notify,
		DocsURL:     spec.DocsURL,
		Owners:      spec.Owners,
		Canary:      spec.Canary,
		Description: spec.Description,
		Version:     spec.Version,
		OnMatch: OnMatch{
			Decision: spec.OnMatch.Decision,
			Reason:   spec.OnMatch.Reason,
			Details:  make(map[string]any, len(spec.OnMatch.Details)),
		},
	}
	for k, v := range spec.OnMatch.Details {
		compiled.OnMatch.Details[k] = v
	}

	return compiled, nil
}

// MustParseWindow is a helper for tests; it panics if the duration cannot be parsed.
func MustParseWindow(value string) time.Duration {
	d, err := time.ParseDuration(value)
	if err != nil {
		panic(err)
	}
	return d
}
