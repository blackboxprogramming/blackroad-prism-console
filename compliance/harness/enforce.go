package harness

import "fmt"

// EnforceOrNotify performs side effects for the supplied decision.
func EnforceOrNotify(rule CompiledRule, dec RuleDecision) error {
	if dec.Decision == "" || dec.Decision == "allow" {
		return nil
	}
	if rule.Canary && dec.Decision == "deny" {
		dec.Decision = "notify"
		dec.Reason = dec.Reason + "_canary"
	}

	switch dec.Decision {
	case "deny":
		return fmt.Errorf("%w:%s:%s", ErrPolicyViolation, dec.Reason, dec.RuleID)
	case "notify":
		payload := map[string]any{
			"text":    dec.Details["message"],
			"rule_id": dec.RuleID,
			"reason":  dec.Reason,
			"details": dec.Details,
		}
		channel := pickChannel(rule)
		return PostSlackMessage(channel, payload)
	default:
		return nil
	}
}

func pickChannel(rule CompiledRule) string {
	if len(rule.Notify.Channels) == 0 {
		return ""
	}
	return rule.Notify.Channels[0]
}

// PostSlackMessage is a hook for sending structured notifications. The default
// implementation is a no-op to keep the harness dependency-free.
func PostSlackMessage(channel string, payload map[string]any) error {
	_ = channel
	_ = payload
	return nil
}
