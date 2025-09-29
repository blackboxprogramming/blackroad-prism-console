package harness

import (
	"fmt"
	"time"
)

type CompiledRule interface{}

type RuleDecision struct {
	Decision string         `json:"decision"`
	Reason   string         `json:"reason"`
	RuleID   string         `json:"rule_id"`
	Details  map[string]any `json:"details,omitempty"`
}

func EvaluateRuleForEvent(rule CompiledRule, event map[string]any) (RuleDecision, error) {
	// TODO: integrate rule evaluation engine
	return RuleDecision{}, fmt.Errorf("not implemented")
}

func EvaluateRuleForSeries(rule CompiledRule, series []map[string]any, window time.Duration) (RuleDecision, error) {
	// TODO: integrate time-series rule evaluation engine
	return RuleDecision{}, fmt.Errorf("not implemented")
}

func EnforceDecision(dec RuleDecision) error {
	switch dec.Decision {
	case "deny":
		return fmt.Errorf("policy_violation: %s (%s)", dec.Reason, dec.RuleID)
	case "notify":
		_ = EmitComplianceNotification(dec)
	}
	return nil
}

func EmitComplianceNotification(dec RuleDecision) error {
	payload := map[string]any{
		"text":     fmt.Sprintf(":rotating_light: %s — %s", dec.Details["message"], dec.Reason),
		"metadata": map[string]any{"rule_id": dec.RuleID, "reason": dec.Reason},
	}
	return PostSlackMessage("#secops", payload)
}

func PostSlackMessage(channel string, payload map[string]any) error {
	// TODO: wire into Slack API client or webhook
	return nil
}
