package harness

import (
	"encoding/json"
	"net/http"
)

// WritePolicyDeny renders a structured deny response for the supplied rule.
func WritePolicyDeny(w http.ResponseWriter, rule CompiledRule, dec RuleDecision, corrID string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusForbidden)

	env := ErrorEnvelope{Error: PolicyError{
		Code:          "policy_violation",
		RuleID:        dec.RuleID,
		Reason:        dec.Reason,
		Message:       str(dec.Details["message"]),
		Remediation:   str(dec.Details["remediation"]),
		DocsURL:       rule.DocsURL,
		Owners:        rule.Owners,
		CorrelationID: corrID,
	}}
	_ = json.NewEncoder(w).Encode(env)
}

func str(v any) string {
	if v == nil {
		return ""
	}
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}
