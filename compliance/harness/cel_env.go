package harness

import (
	"time"

	"github.com/google/cel-go/cel"
	"github.com/google/cel-go/checker/decls"
	"github.com/google/cel-go/common/types"
	"github.com/google/cel-go/common/types/ref"
	"github.com/google/cel-go/interpreter/functions"
	exprpb "google.golang.org/genproto/googleapis/api/expr/v1alpha1"
)

// RateBinding provides the implementation for the rate() helper function.
type RateBinding struct {
	Provider    MetricsProvider
	SelectorFor func(window string) Selector
}

// EnvWithRate returns a CEL environment and options with the rate() overload wired in.
func EnvWithRate(binding RateBinding) (*cel.Env, []cel.ProgramOption, error) {
	env, err := cel.NewEnv(
		cel.Declarations(
			decls.NewVar("action", decls.String),
			decls.NewVar("resource_class", decls.String),
			decls.NewVar("resource_provider", decls.String),
			decls.NewVar("deny_reason", decls.String),
			decls.NewVar("error_kind", decls.String),
			decls.NewVar("ts", decls.Timestamp),
			decls.NewFunction("rate",
				decls.NewOverload("rate_pred_window",
					[]*exprpb.Type{decls.Bool, decls.String}, decls.Double),
			),
		),
	)
	if err != nil {
		return nil, nil, err
	}

	opts := []cel.ProgramOption{
		cel.Functions(&functions.Overload{
			Operator: "rate_pred_window",
			Binary: func(lhs, rhs ref.Val) ref.Val {
				if binding.Provider == nil {
					return types.NewErr("rate err: provider not configured")
				}
				if binding.SelectorFor == nil {
					return types.NewErr("rate err: selector not configured")
				}

				if _, ok := lhs.Value().(bool); !ok {
					return types.NewErr("rate err: predicate must be boolean")
				}

				winStr, _ := rhs.Value().(string)
				if winStr == "" {
					return types.NewErr("rate err: window must be non-empty")
				}
				window, err := time.ParseDuration(winStr)
				if err != nil {
					return types.NewErr("rate err: invalid duration %q", winStr)
				}

				selector := binding.SelectorFor(winStr)
				value, err := binding.Provider.Rate(selector, window)
				if err != nil {
					return types.NewErr("rate err: %v", err)
				}
				if value < 0 || value > 1 {
					return types.NewErr("rate err: provider returned invalid value %f", value)
				}
				return types.Double(value)
			},
		}),
	}
	return env, opts, nil
}
