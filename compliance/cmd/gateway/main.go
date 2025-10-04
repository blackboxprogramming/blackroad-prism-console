package main

import (
	"log"
	"net/http"
	"os"

	"github.com/blackroad/prism-console/compliance/harness"
)

func main() {
	mirror, err := harness.CompileFromYAML("rules/mirror_class_limit.yaml")
	if err != nil {
		log.Fatalf("compile mirror rule: %v", err)
	}
	registry := &harness.RuleRegistry{ByID: map[string]harness.CompiledRule{
		mirror.ID: mirror,
	}}

	http.HandleFunc("/mirror", func(w http.ResponseWriter, r *http.Request) {
		rule, ok := registry.Find(mirror.ID)
		if !ok {
			http.Error(w, "rule not found", http.StatusInternalServerError)
			return
		}

		event := map[string]any{
			"action":            "mirror",
			"resource_class":    r.URL.Query().Get("class"),
			"resource_provider": "github",
		}

		decision, err := harness.EvaluateEvent(rule, event)
		if err != nil {
			http.Error(w, "policy_eval_error", http.StatusServiceUnavailable)
			return
		}
		if err := harness.EnforceOrNotify(rule, decision); err != nil {
			harness.WritePolicyDeny(w, rule, decision, "req_demo_123")
			return
		}

		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("mirror allowed\n"))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("gateway listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
