package harness

import "fmt"

func EvaluateEvent(rule CompiledRule, event map[string]any) (RuleDecision, error) {
	ev := NormalizeEvent(event)
	out, _, err := rule.Program.Eval(ev)
	if err != nil {
		return RuleDecision{}, fmt.Errorf("eval: %w", err)
	}

	match, ok := out.Value().(bool)
	if !ok {
		return RuleDecision{}, fmt.Errorf("eval not boolean")
	}

	if !match {
		return RuleDecision{Decision: "allow", Reason: "", RuleID: rule.ID, Details: map[string]any{}}, nil
	}

	dec := RuleDecision{
		Decision: rule.OnMatch.Decision,
		Reason:   rule.OnMatch.Reason,
		RuleID:   rule.ID,
		Details:  cloneMap(rule.OnMatch.Details),
	}
	if dec.Decision == "" {
		dec.Decision = "deny"
	}
	if dec.Reason == "" {
		dec.Reason = rule.ID
	}
	if dec.Details == nil {
		dec.Details = map[string]any{}
	}
	return dec, nil
}
