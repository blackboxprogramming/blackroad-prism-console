package harness

import "fmt"

func EnforceOrNotify(rule CompiledRule, dec RuleDecision) error {
	switch dec.Decision {
	case "deny":
		return fmt.Errorf("%w:%s:%s", ErrPolicyViolation, dec.Reason, dec.RuleID)
	case "notify":
		details := map[string]any{}
		if dec.Details != nil {
			details = dec.Details
		}
		payload := map[string]any{
			"text":    details["message"],
			"rule_id": dec.RuleID,
			"reason":  dec.Reason,
			"details": details,
		}
		channel := ""
		if ch := GetEnv("SLACK_CHANNEL", ""); ch != "" {
			channel = ch
		} else if len(rule.Notify.Channels) > 0 {
			channel = rule.Notify.Channels[0]
		}
		_ = PostSlackMessage(channel, payload)
	}
	return nil
}
