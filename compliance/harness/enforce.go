package harness

import "fmt"

// EnforceOrNotify performs side effects for the supplied decision.
func EnforceOrNotify(rule CompiledRule, dec RuleDecision) error {
	if dec.Decision == "" || dec.Decision == "allow" {
		return nil
	}

	if rule.Canary && dec.Decision == "deny" {
		dec.Decision = "notify"
		if dec.Reason != "" {
			dec.Reason += "_canary"
		} else {
			dec.Reason = rule.ID + "_canary"
		}
	}

	switch dec.Decision {
	case "deny":
		return fmt.Errorf("%w:%s:%s", ErrPolicyViolation, dec.Reason, dec.RuleID)
	case "notify":
		payload := map[string]any{
			"text":    messageFromDetails(dec.Details),
			"rule_id": dec.RuleID,
			"reason":  dec.Reason,
			"details": ensureDetails(dec.Details),
		}
		return PostSlackMessage(pickChannel(rule), payload)
	default:
		return nil
	}
}

func pickChannel(rule CompiledRule) string {
	if ch := GetEnv("SLACK_CHANNEL", ""); ch != "" {
		return ch
	}
	if len(rule.Notify.Channels) == 0 {
		return ""
	}
	return rule.Notify.Channels[0]
}

func ensureDetails(details map[string]any) map[string]any {
	if details == nil {
		return map[string]any{}
	}
	return details
}

func messageFromDetails(details map[string]any) string {
	if details == nil {
		return ":rotating_light: Compliance notification"
	}
	if msg, ok := details["message"]; ok {
		if s, ok := msg.(string); ok {
			return s
		}
		return fmt.Sprintf("%v", msg)
	}
	return ":rotating_light: Compliance notification"
}
