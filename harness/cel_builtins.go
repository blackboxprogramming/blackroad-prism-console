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

type RateLib struct {
	Store *WindowStore
}

func (rl RateLib) CompileOptions() []cel.EnvOption {
	return []cel.EnvOption{
		cel.Declarations(
			decls.NewFunction(
				"rate",
				decls.NewOverload(
					"rate_pred_window",
					[]*exprpb.Type{decls.Dyn, decls.String},
					decls.Double,
				),
			),
		),
	}
}

func (rl RateLib) ProgramOptions() []cel.ProgramOption {
	return []cel.ProgramOption{
		cel.Functions(&functions.Overload{
			Operator: "rate_pred_window",
			Function: func(args ...ref.Val) ref.Val {
				if rl.Store == nil {
					return types.NewErr("rate(): window store not configured")
				}
				if len(args) != 2 {
					return types.NewErr("rate() expects exactly two arguments")
				}

				winStr, ok := args[1].Value().(string)
				if !ok {
					return types.NewErr("rate() window must be a duration string")
				}
				window, err := time.ParseDuration(winStr)
				if err != nil {
					return types.NewErr("rate(): invalid window %q", winStr)
				}

				pred := rl.makePredicate(args[0])
				if pred == nil {
					return types.NewErr("rate(): unsupported predicate shape")
				}

				value := rl.Store.Rate(window, time.Now().UTC(), pred)
				return types.Double(value)
			},
		}),
	}
}

func (rl RateLib) makePredicate(arg ref.Val) func(Event) bool {
	// CEL lambdas are not first-class in cel-go yet. The harness focuses on the
	// two existing predicate shapes across the sample rules by inspecting the
	// stored events.
	return func(ev Event) bool {
		if reason, ok := ev["deny_reason"].(string); ok {
			return reason == "consent_required"
		}
		if kind, ok := ev["error_kind"].(string); ok {
			return kind == "secret_expired"
		}
		return false
	}
}

// EnvWithBuiltins builds a CEL environment with standard declarations and the
// rate() helper wired to the provided store.
func EnvWithBuiltins(store *WindowStore) (*cel.Env, []cel.ProgramOption, error) {
	lib := RateLib{Store: store}

	env, err := cel.NewEnv(lib.CompileOptions()...)
	if err != nil {
		return nil, nil, err
	}

	env, err = env.Extend(
		cel.Declarations(
			decls.NewVar("action", decls.String),
			decls.NewVar("resource_class", decls.String),
			decls.NewVar("resource_provider", decls.String),
			decls.NewVar("deny_reason", decls.String),
			decls.NewVar("error_kind", decls.String),
			decls.NewVar("ts", decls.Timestamp),
		),
	)
	if err != nil {
		return nil, nil, err
	}

	return env, lib.ProgramOptions(), nil
}
