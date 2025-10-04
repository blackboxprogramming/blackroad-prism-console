package harness

import (
	"time"

	"github.com/google/cel-go/cel"
	"github.com/google/cel-go/common/types"
	"github.com/google/cel-go/common/types/ref"
	"github.com/google/cel-go/interpreter/functions"
)

// DistinctExtras exposes a CEL helper that returns the count of distinct values
// for the supplied field over a rolling window backed by the WindowStore.
func DistinctExtras(store *WindowStore) cel.ProgramOption {
	return cel.Functions(
		&functions.Overload{
			Operator: "distinct_over_field_window",
			Binary: func(lhs, rhs ref.Val) ref.Val {
				field, ok := lhs.Value().(string)
				if !ok {
					return types.NewErr("distinct_over: field argument must be a string")
				}

				windowText, ok := rhs.Value().(string)
				if !ok {
					return types.NewErr("distinct_over: window argument must be a duration string")
				}

				win, err := time.ParseDuration(windowText)
				if err != nil {
					return types.NewErr("distinct_over: invalid window %q", windowText)
				}

				events := store.Snapshot(win, time.Now().UTC())
				seen := make(map[any]struct{}, len(events))
				for _, event := range events {
					if value, ok := event[field]; ok {
						seen[value] = struct{}{}
					}
				}

				return types.Int(int64(len(seen)))
			},
		},
	)
}
