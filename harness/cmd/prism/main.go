package main

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	harness "github.com/blackroad/prism-console/harness"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, "usage: harness <command>")
		os.Exit(2)
	}

	switch os.Args[1] {
	case "smoke:rate":
		runSmokeRate()
	default:
		fmt.Fprintf(os.Stderr, "unknown command %q\n", os.Args[1])
		os.Exit(2)
	}
}

func runSmokeRate() {
	store := harness.NewWindowStore(512)
	rulePath := filepath.Join("..", "rules", "consent_friction_spike.yaml")
	cr, err := harness.CompileFromYAML(rulePath, store)
	if err != nil {
		panic(err)
	}

	now := time.Now().UTC()
	for i := 0; i < 8; i++ {
		store.Append(now.Add(-time.Duration(14-i)*time.Minute), map[string]any{"deny_reason": "insufficient_role"})
	}
	store.Append(now.Add(-2*time.Minute), map[string]any{"deny_reason": "consent_required"})
	store.Append(now.Add(-1*time.Minute), map[string]any{"deny_reason": "consent_required"})

	dec, err := harness.EvaluateEvent(cr, map[string]any{"deny_reason": ""})
	if err != nil {
		panic(err)
	}
	harness.PrintDecision(dec)
}
