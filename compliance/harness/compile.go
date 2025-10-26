package harness

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/blackroad/prism-console/compliance/rules"
	"github.com/google/cel-go/cel"
)

// CompileFromYAML parses, type-checks, and prepares a rule for execution.
func CompileFromYAML(path string) (CompiledRule, error) {
	spec, err := LoadRuleYAML(path)
	if err != nil {
		return CompiledRule{}, err
	}

	env, err := EnvWithBuiltins()
	if err != nil {
		return CompiledRule{}, fmt.Errorf("cel env: %w", err)
	}

	bindings, err := buildFunctionBindings(spec)
	if err != nil {
		return CompiledRule{}, err
	}

	programOptions := []cel.ProgramOption{rules.BindComplianceFunctions(bindings)}

	ast, iss := env.Parse(spec.Expr)
	if iss.Err() != nil {
		return CompiledRule{}, fmt.Errorf("parse CEL: %w", iss.Err())
	}
	ast, iss = env.Check(ast)
	if iss.Err() != nil {
		return CompiledRule{}, fmt.Errorf("check CEL: %w", iss.Err())
	}

	prog, err := env.Program(ast, programOptions...)
	if err != nil {
		return CompiledRule{}, fmt.Errorf("program: %w", err)
	}

	compiled := CompiledRule{
		ID:          spec.RuleID,
		Name:        spec.Name,
		Category:    spec.Category,
		Severity:    spec.Severity,
		Expr:        spec.Expr,
		Program:     prog,
		Notify:      NotifySpec{Channels: append([]string(nil), spec.Notify.Channels...)},
		DocsURL:     spec.DocsURL,
		Owners:      append([]string(nil), spec.Owners...),
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

// CompileMirror compiles the canonical mirror rule shipped with the harness.
func CompileMirror() (CompiledRule, error) {
	return CompileFromYAML("rules/mirror_class_limit.yaml")
}

func buildFunctionBindings(spec *RuleSpec) (rules.FunctionBindings, error) {
	provider, err := selectMetricsProvider()
	if err != nil {
		return rules.FunctionBindings{}, err
	}

	selectorFor := func(window time.Duration) Selector {
		prom := strings.TrimSpace(firstNonEmpty(spec.MetricsSelector["prom"], spec.MetricsSelector["promql"]))
		ch := strings.TrimSpace(firstNonEmpty(spec.MetricsSelector["ch"], spec.MetricsSelector["sql"]))
		return Selector{PromQL: prom, CHSQL: ch}
	}

	bindings := rules.FunctionBindings{
		ToolReputation: func(string) (int64, error) { return 0, nil },
		DurationBelow:  func(string, int64) (time.Duration, error) { return 0, nil },
	}

	if provider == nil {
		bindings.Rate = func(bool, time.Duration) (float64, error) { return 0, nil }
		return bindings, nil
	}

	bindings.Rate = func(_ bool, window time.Duration) (float64, error) {
		selector := selectorFor(window)
		switch p := provider.(type) {
		case *PromProvider:
			if selector.PromQL == "" {
				return 0, nil
			}
			return p.Rate(selector, window)
		case *CHProvider:
			if selector.CHSQL == "" {
				return 0, nil
			}
			return p.Rate(selector, window)
		default:
			return provider.Rate(selector, window)
		}
	}

	return bindings, nil
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}

func selectMetricsProvider() (MetricsProvider, error) {
	if url := os.Getenv("PROM_URL"); url != "" {
		return NewProm(), nil
	}
	if dsn := os.Getenv("CH_DSN"); dsn != "" {
		return NewCH()
	}
	return nil, nil
}

// MustParseWindow is a helper for tests; it panics if the duration cannot be parsed.
func MustParseWindow(value string) time.Duration {
	d, err := time.ParseDuration(value)
	if err != nil {
		panic(err)
	}
	return d
}
