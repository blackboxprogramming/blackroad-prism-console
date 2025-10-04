package harness

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type PolicyError struct {
	Code          string `json:"code"`
	RuleID        string `json:"rule_id"`
	Reason        string `json:"reason"`
	Message       string `json:"message"`
	Remediation   string `json:"remediation,omitempty"`
	CorrelationID string `json:"correlation_id"`
}

type ErrorEnvelope struct {
	Error PolicyError `json:"error"`
}

// WritePolicyDeny converts a rule decision into a JSON payload suitable for HTTP gateways.
func WritePolicyDeny(w http.ResponseWriter, dec RuleDecision, corrID string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusForbidden)

	env := ErrorEnvelope{
		Error: PolicyError{
			Code:          "policy_violation",
			RuleID:        dec.RuleID,
			Reason:        dec.Reason,
			Message:       str(dec.Details["message"]),
			Remediation:   str(dec.Details["remediation"]),
			CorrelationID: corrID,
		},
	}
	_ = json.NewEncoder(w).Encode(env)
}

func str(v any) string {
	if v == nil {
		return ""
	}
	switch s := v.(type) {
	case string:
		return s
	default:
		return anyToString(v)
	}
}

func anyToString(v any) string {
	return fmt.Sprintf("%v", v)
}
