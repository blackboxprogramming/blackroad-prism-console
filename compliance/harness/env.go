package harness

import (
	"encoding/json"
	"os"

	"github.com/google/cel-go/cel"

	"github.com/blackroad/prism-console/compliance/rules"
)

func EnvWithBuiltins() (*cel.Env, error) {
	return rules.NewComplianceEnv()
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
