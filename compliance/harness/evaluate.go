package harness

import (
	"fmt"
)

// EvaluateEvent executes the compiled CEL program against the provided event
// payload and returns the resulting decision.
func EvaluateEvent(rule CompiledRule, event map[string]any) (RuleDecision, error) {
	if rule.Program == nil {
		return RuleDecision{}, fmt.Errorf("rule %s has no program", rule.ID)
	}
	out, _, err := rule.Program.Eval(event)
	if err != nil {
		return RuleDecision{}, fmt.Errorf("rule %s eval: %w", rule.ID, err)
	}

	boolVal, ok := out.Value().(bool)
	if !ok {
		return RuleDecision{}, fmt.Errorf("rule %s: expression must return bool, got %T", rule.ID, out.Value())
	}

	decision := RuleDecision{
		RuleID:  rule.ID,
		Details: map[string]any{},
	}
	if boolVal {
		decision.Decision = rule.OnMatch.Decision
		decision.Reason = rule.OnMatch.Reason
		if len(rule.OnMatch.Details) > 0 {
			decision.Details = make(map[string]any, len(rule.OnMatch.Details))
			for k, v := range rule.OnMatch.Details {
				decision.Details[k] = v
			}
		}
		return decision, nil
	}

	decision.Decision = "allow"
	return decision, nil
}
