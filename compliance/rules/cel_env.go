package rules

import (
	"fmt"
	"time"

	"github.com/google/cel-go/cel"
	"github.com/google/cel-go/checker/decls"
	"github.com/google/cel-go/common/types"
	"github.com/google/cel-go/common/types/ref"
	"github.com/google/cel-go/interpreter/functions"
	exprpb "google.golang.org/genproto/googleapis/api/expr/v1alpha1"
)

// FunctionBindings wires concrete implementations for the compliance-focused helper
// functions that are exposed to CEL rules.
type FunctionBindings struct {
	Rate           func(predicate bool, window time.Duration) (float64, error)
	ToolReputation func(tool string) (int64, error)
	DurationBelow  func(tool string, orgID int64) (time.Duration, error)
}

// NewComplianceEnv returns a CEL environment preloaded with the helper declarations
// needed for compliance metric rules.
func NewComplianceEnv() (*cel.Env, error) {
	return cel.NewEnv(
		cel.Declarations(
			decls.NewFunction("rate", decls.NewOverload("rate_bool_window",
				[]*exprpb.Type{decls.Bool, decls.String}, decls.Double)),
			decls.NewFunction("tool_reputation", decls.NewOverload("rep_tool",
				[]*exprpb.Type{decls.String}, decls.Int)),
			decls.NewFunction("duration_below", decls.NewOverload("dur_tool_org",
				[]*exprpb.Type{decls.String, decls.Int}, decls.String)),
		),
	)
}

// BindComplianceFunctions converts the supplied bindings into CEL function overloads.
func BindComplianceFunctions(bindings FunctionBindings) cel.ProgramOption {
	return cel.Functions(
		&functions.Overload{
			Operator: "rate_bool_window",
			Binary: func(lhs, rhs ref.Val) ref.Val {
				if bindings.Rate == nil {
					return types.NewErr("rate() binding is not configured")
				}

				pred, ok := lhs.Value().(bool)
				if !ok {
					return types.NewErr("rate() expects a boolean predicate")
				}

				windowStr, ok := rhs.Value().(string)
				if !ok {
					return types.NewErr("rate() expects a window string, e.g. '15m'")
				}

				window, err := time.ParseDuration(windowStr)
				if err != nil {
					return types.NewErr("rate(): invalid duration %q", windowStr)
				}

				value, err := bindings.Rate(pred, window)
				if err != nil {
					return types.NewErr("rate(): %v", err)
				}

				return types.Double(value)
			},
		},
		&functions.Overload{
			Operator: "rep_tool",
			Unary: func(arg ref.Val) ref.Val {
				if bindings.ToolReputation == nil {
					return types.NewErr("tool_reputation() binding is not configured")
				}

				tool, ok := arg.Value().(string)
				if !ok {
					return types.NewErr("tool_reputation() expects a tool name string")
				}

				value, err := bindings.ToolReputation(tool)
				if err != nil {
					return types.NewErr("tool_reputation(): %v", err)
				}

				return types.Int(value)
			},
		},
		&functions.Overload{
			Operator: "dur_tool_org",
			Binary: func(lhs, rhs ref.Val) ref.Val {
				if bindings.DurationBelow == nil {
					return types.NewErr("duration_below() binding is not configured")
				}

				tool, ok := lhs.Value().(string)
				if !ok {
					return types.NewErr("duration_below() expects a tool name string")
				}

				orgIDVal, ok := rhs.Value().(int64)
				if !ok {
					return types.NewErr("duration_below() expects an org id (int)")
				}

				dur, err := bindings.DurationBelow(tool, orgIDVal)
				if err != nil {
					return types.NewErr("duration_below(): %v", err)
				}

				return types.String(formatDuration(dur))
			},
		},
	)
}

func formatDuration(d time.Duration) string {
	if d < 0 {
		return fmt.Sprintf("-%s", formatDuration(-d))
	}
	// Prefer hour granularity for readability and compliance reports.
	if d%time.Hour == 0 {
		return fmt.Sprintf("%dh", int64(d/time.Hour))
	}
	if d%time.Minute == 0 {
		return fmt.Sprintf("%dm", int64(d/time.Minute))
	}
	return d.String()
}
