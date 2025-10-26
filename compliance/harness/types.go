package harness

import (
	"errors"

	"github.com/google/cel-go/cel"
)

// ErrPolicyViolation is returned when a rule decides to deny a request.
var ErrPolicyViolation = errors.New("policy_violation")

// OnMatch describes what to do when a rule expression evaluates to true.
type OnMatch struct {
	Decision string
	Reason   string
	Details  map[string]any
}

// NotifySpec carries routing metadata for secondary actions such as Slack.
type NotifySpec struct {
	Channels []string `yaml:"channels"`
}

// CompiledRule is the runtime form of a rule ready for evaluation.
type CompiledRule struct {
	ID          string
	Name        string
	Category    string
	Severity    string
	Expr        string
	Program     cel.Program
	OnMatch     OnMatch
	Notify      NotifySpec
	DocsURL     string
	Owners      []string
	Canary      bool
	Description string
	Version     int
}

// RuleDecision captures the outcome of evaluating a rule against an event.
type RuleDecision struct {
	RuleID   string
	Decision string
	Reason   string
	Details  map[string]any
}

// RuleRegistry offers lookup utilities for compiled rules.
type RuleRegistry struct {
	ByID map[string]CompiledRule
}

// Find returns the compiled rule for the given identifier.
func (r *RuleRegistry) Find(id string) (CompiledRule, bool) {
	if r == nil {
		return CompiledRule{}, false
	}
	cr, ok := r.ByID[id]
	return cr, ok
}

// PolicyError is the structured JSON response returned to clients on deny.
type PolicyError struct {
	Code          string   `json:"code"`
	RuleID        string   `json:"rule_id"`
	Reason        string   `json:"reason"`
	Message       string   `json:"message"`
	Remediation   string   `json:"remediation,omitempty"`
	DocsURL       string   `json:"docs_url,omitempty"`
	Owners        []string `json:"owners,omitempty"`
	CorrelationID string   `json:"correlation_id"`
}

// ErrorEnvelope is the top-level payload shape for deny responses.
type ErrorEnvelope struct {
	Error PolicyError `json:"error"`
}
