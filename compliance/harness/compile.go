package harness

import (
	"fmt"

	"github.com/google/cel-go/cel"
)

type CompiledRule struct {
	ID       string
	Category string
	Severity string
	Expr     string
	Program  cel.Program
	OnMatch  OnMatch
	Notify   NotifySpec
}

func CompileFromYAML(path string) (CompiledRule, error) {
	spec, err := LoadRuleYAML(path)
	if err != nil {
		return CompiledRule{}, err
	}

	env := EnvWithBuiltins()
	ast, iss := env.Parse(spec.Expr)
	if iss.Err() != nil {
		return CompiledRule{}, fmt.Errorf("parse CEL: %w", iss.Err())
	}
	checked, iss := env.Check(ast)
	if iss.Err() == nil {
		ast = checked
	}
	prg, err := env.Program(ast)
	if err != nil {
		return CompiledRule{}, fmt.Errorf("program: %w", err)
	}

	return CompiledRule{
		ID:       spec.RuleID,
		Category: spec.Category,
		Severity: spec.Severity,
		Expr:     spec.Expr,
		Program:  prg,
		OnMatch:  spec.OnMatch,
		Notify:   spec.Notify,
	}, nil
}

func CompileMirror() (CompiledRule, error) {
	return CompileFromYAML("rules/mirror_class_limit.yaml")
}
