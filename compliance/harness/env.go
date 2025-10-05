package harness

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/google/cel-go/cel"

	"github.com/blackroad/prism-console/compliance/rules"
)

type RuleDecision struct {
	Decision string         `json:"decision"`
	Reason   string         `json:"reason"`
	RuleID   string         `json:"rule_id"`
	Details  map[string]any `json:"details,omitempty"`
}

func EnvWithBuiltins() *cel.Env {
	env, err := rules.NewComplianceEnv()
	if err != nil {
		panic(fmt.Sprintf("cel env: %v", err))
	}
	return env
}

func NormalizeEvent(event map[string]any) map[string]any {
	if event == nil {
		return map[string]any{}
	}
	return event
}

func cloneMap(src map[string]any) map[string]any {
	if src == nil {
		return map[string]any{}
	}
	out := make(map[string]any, len(src))
	for k, v := range src {
		out[k] = v
	}
	return out
}

func PrintDecision(dec RuleDecision) {
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	_ = enc.Encode(dec)
}

func GetEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
