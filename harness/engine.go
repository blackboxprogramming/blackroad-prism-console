package harness

import (
	"fmt"
	"time"
)

// RuleDecision captures the outcome of evaluating a rule against an event.
type RuleDecision struct {
	RuleID      string
	Mode        string
	Severity    string
	Decision    string
	Reason      string
	Details     map[string]any
	Matched     bool
	EvaluatedAt time.Time
}

func EvaluateEvent(rule CompiledRule, event Event) (RuleDecision, error) {
	if rule.Program == nil {
		return RuleDecision{}, fmt.Errorf("rule %s is not compiled", rule.ID)
	}

	normalized := NormalizeEvent(event)
	out, _, err := rule.Program.Eval(normalized)
	if err != nil {
		return RuleDecision{}, err
	}

	matched, ok := out.Value().(bool)
	if !ok {
		return RuleDecision{}, fmt.Errorf("rule %s did not return a boolean", rule.ID)
	}

	decision := RuleDecision{
		RuleID:      rule.ID,
		Mode:        rule.Mode,
		Severity:    rule.Severity,
		Matched:     matched,
		EvaluatedAt: time.Now().UTC(),
	}

	if matched {
		switch rule.Mode {
		case "enforce":
			decision.Decision = "deny"
		case "observe", "monitor":
			decision.Decision = "notify"
		default:
			decision.Decision = "notify"
		}
	} else {
		decision.Decision = "allow"
	}

	decision.Reason = deriveReason(normalized, rule, matched)
	decision.Details = buildDetails(normalized, rule, matched)

	return decision, nil
}

func deriveReason(ev Event, rule CompiledRule, matched bool) string {
	if !matched {
		return ""
	}
	if reason, ok := ev["deny_reason"].(string); ok && reason != "" {
		return reason
	}
	if kind, ok := ev["error_kind"].(string); ok && kind != "" {
		return kind
	}
	if reason, ok := rule.Metadata["reason"].(string); ok && reason != "" {
		return reason
	}
	if summary, ok := rule.Metadata["summary"].(string); ok && summary != "" {
		return summary
	}
	return rule.ID
}

func buildDetails(ev Event, rule CompiledRule, matched bool) map[string]any {
	details := map[string]any{}
	if matched {
		if msg, ok := rule.Metadata["block_message"].(string); ok && msg != "" {
			details["message"] = msg
		} else if msg, ok := rule.Metadata["message"].(string); ok && msg != "" {
			details["message"] = msg
		}
		if remediation, ok := rule.Metadata["remediation"].(string); ok && remediation != "" {
			details["remediation"] = remediation
		}
	}
	return details
}

// PrintDecision emits a human readable version of the decision, useful for
// ad-hoc CLI invocations.
func PrintDecision(dec RuleDecision) {
	fmt.Printf("[%s] %s -> %s (reason=%s)\n", dec.Severity, dec.RuleID, dec.Decision, dec.Reason)
	if len(dec.Details) > 0 {
		fmt.Println("details:")
		for k, v := range dec.Details {
			fmt.Printf("  %s: %v\n", k, v)
		}
	}
}

// EnforceOrNotify is a placeholder for whatever side effects callers wish to
// trigger after a decision is reached (e.g. Slack notification, audit log).
func EnforceOrNotify(rule CompiledRule, dec RuleDecision) error {
	// For the harness we simply acknowledge the decision. Real systems would
	// dispatch to enforcement or notification mechanisms.
	_ = rule
	_ = dec
	return nil
}
