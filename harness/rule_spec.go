package harness

import (
	"fmt"
	"os"

	"github.com/google/cel-go/cel"
	"gopkg.in/yaml.v3"
)

type RuleSpec struct {
	RuleID       string            `yaml:"id"`
	Category     string            `yaml:"category"`
	Mode         string            `yaml:"mode"`
	Severity     string            `yaml:"severity"`
	Expr         string            `yaml:"expr"`
	Notify       []string          `yaml:"notify"`
	OnMatch      map[string]any    `yaml:"on_match"`
	Metadata     map[string]any    `yaml:"metadata"`
	BlockOnError bool              `yaml:"block_on_error"`
	Owners       []string          `yaml:"owners"`
	Tags         map[string]string `yaml:"tags"`
}

// CompiledRule contains the executable CEL program and rule metadata.
type CompiledRule struct {
	ID           string
	Category     string
	Mode         string
	Severity     string
	Expr         string
	Program      cel.Program
	OnMatch      map[string]any
	Notify       []string
	Metadata     map[string]any
	BlockOnError bool
	Owners       []string
	Tags         map[string]string
	Store        *WindowStore
}

func LoadRuleYAML(path string) (RuleSpec, error) {
	var spec RuleSpec

	raw, err := os.ReadFile(path)
	if err != nil {
		return spec, err
	}
	if err := yaml.Unmarshal(raw, &spec); err != nil {
		return spec, err
	}
	if spec.RuleID == "" {
		return spec, fmt.Errorf("rule %q missing id", path)
	}
	if spec.Expr == "" {
		return spec, fmt.Errorf("rule %s missing expr", spec.RuleID)
	}
	return spec, nil
}

func (spec RuleSpec) compileWithEnv(env *cel.Env, progOpts []cel.ProgramOption, store *WindowStore) (CompiledRule, error) {
	ast, iss := env.Parse(spec.Expr)
	if iss.Err() != nil {
		return CompiledRule{}, fmt.Errorf("parse CEL: %w", iss.Err())
	}

	ast, iss = env.Check(ast)
	if iss.Err() != nil {
		return CompiledRule{}, fmt.Errorf("check CEL: %w", iss.Err())
	}

	prg, err := env.Program(ast, progOpts...)
	if err != nil {
		return CompiledRule{}, fmt.Errorf("program: %w", err)
	}

	return CompiledRule{
		ID:           spec.RuleID,
		Category:     spec.Category,
		Mode:         spec.Mode,
		Severity:     spec.Severity,
		Expr:         spec.Expr,
		Program:      prg,
		OnMatch:      spec.OnMatch,
		Notify:       append([]string(nil), spec.Notify...),
		Metadata:     NormalizeEvent(spec.Metadata),
		BlockOnError: spec.BlockOnError,
		Owners:       append([]string(nil), spec.Owners...),
		Tags:         copyStringMap(spec.Tags),
		Store:        store,
	}, nil
}
