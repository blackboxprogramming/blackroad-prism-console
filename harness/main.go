package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"

	"gopkg.in/yaml.v3"
)

type onMatchConfig struct {
	Decision string         `yaml:"decision"`
	Reason   string         `yaml:"reason"`
	Details  map[string]any `yaml:"details"`
}

type rawRule struct {
	RuleID  string         `yaml:"rule_id"`
	ID      string         `yaml:"id"`
	Expr    string         `yaml:"expr"`
	OnMatch *onMatchConfig `yaml:"on_match"`
}

type compiledRule struct {
	ID        string
	Expr      string
	Threshold float64
	OnMatch   onMatchConfig
}

type series struct {
	Window string        `json:"window"`
	Events []seriesEvent `json:"events"`
}

type seriesEvent struct {
	Repeat int
	Fields map[string]any
}

type decision struct {
	Decision string  `json:"decision"`
	Reason   string  `json:"reason,omitempty"`
	Ratio    float64 `json:"ratio"`
}

func (e *seriesEvent) UnmarshalJSON(data []byte) error {
	type alias struct {
		Repeat *int           `json:"repeat"`
		Each   map[string]any `json:"each"`
	}
	var a alias
	if err := json.Unmarshal(data, &a); err == nil && a.Repeat != nil {
		rep := *a.Repeat
		if rep <= 0 {
			rep = 1
		}
		e.Repeat = rep
		e.Fields = cloneMap(a.Each)
		return nil
	}
	var obj map[string]any
	if err := json.Unmarshal(data, &obj); err != nil {
		return err
	}
	repeat := 1
	if rep, ok := obj["repeat"]; ok {
		repeat = intFromAny(rep)
		delete(obj, "repeat")
	}
	if each, ok := obj["each"].(map[string]any); ok {
		e.Fields = cloneMap(each)
	} else {
		e.Fields = cloneMap(obj)
	}
	if repeat <= 0 {
		repeat = 1
	}
	e.Repeat = repeat
	return nil
}

func (s series) expand() []map[string]any {
	var expanded []map[string]any
	for _, ev := range s.Events {
		repeat := ev.Repeat
		if repeat <= 0 {
			repeat = 1
		}
		for i := 0; i < repeat; i++ {
			expanded = append(expanded, cloneMap(ev.Fields))
		}
	}
	return expanded
}

func cloneMap(src map[string]any) map[string]any {
	if src == nil {
		return map[string]any{}
	}
	dst := make(map[string]any, len(src))
	for k, v := range src {
		dst[k] = v
	}
	return dst
}

func intFromAny(v any) int {
	switch value := v.(type) {
	case int:
		return value
	case int64:
		return int(value)
	case float64:
		return int(value)
	case json.Number:
		n, _ := value.Int64()
		return int(n)
	case string:
		if parsed, err := strconv.Atoi(value); err == nil {
			return parsed
		}
	}
	return 1
}

func compileFromYAML(path string) (compiledRule, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return compiledRule{}, err
	}
	var raw rawRule
	if err := yaml.Unmarshal(data, &raw); err != nil {
		return compiledRule{}, err
	}
	id := raw.RuleID
	if id == "" {
		id = raw.ID
	}
	if id == "" {
		return compiledRule{}, errors.New("rule id is required")
	}
	threshold, err := parseThreshold(raw.Expr)
	if err != nil {
		return compiledRule{}, err
	}
	compiled := compiledRule{
		ID:        id,
		Expr:      raw.Expr,
		Threshold: threshold,
	}
	if raw.OnMatch != nil {
		compiled.OnMatch = *raw.OnMatch
	}
	if compiled.OnMatch.Decision == "" {
		compiled.OnMatch.Decision = "notify"
	}
	return compiled, nil
}

func parseThreshold(expr string) (float64, error) {
	idx := strings.LastIndex(expr, ">")
	if idx == -1 {
		return 0, errors.New("expression must contain '>' comparison")
	}
	segment := strings.TrimSpace(expr[idx+1:])
	if segment == "" {
		return 0, errors.New("comparison threshold missing")
	}
	fields := strings.Fields(segment)
	if len(fields) > 0 {
		segment = fields[0]
	}
	segment = strings.Trim(segment, "()")
	value, err := strconv.ParseFloat(segment, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid threshold %q: %w", segment, err)
	}
	return value, nil
}

func evaluateRuleForSeries(rule compiledRule, input series) (decision, error) {
	events := input.expand()
	started := 0
	resolved := 0
	for _, ev := range events {
		denyReason := strings.ToLower(stringify(ev["deny_reason"]))
		if denyReason == "consent_required" {
			started++
		}
		outcome := strings.ToLower(stringify(ev["outcome"]))
		if outcome == "allow" {
			resolved++
		}
	}
	ratio := 0.0
	if started > 0 {
		abandon := started - resolved
		if abandon < 0 {
			abandon = 0
		}
		ratio = float64(abandon) / float64(started)
		if ratio < 0 {
			ratio = 0
		}
		if ratio > 1 {
			ratio = 1
		}
	}
	result := decision{
		Decision: "allow",
		Ratio:    ratio,
	}
	if ratio > rule.Threshold {
		result.Decision = rule.OnMatch.Decision
		if result.Decision == "" {
			result.Decision = "notify"
		}
		result.Reason = rule.OnMatch.Reason
	}
	return result, nil
}

func stringify(v any) string {
	switch value := v.(type) {
	case string:
		return value
	case fmt.Stringer:
		return value.String()
	case json.Number:
		return value.String()
	case nil:
		return ""
	default:
		return fmt.Sprintf("%v", value)
	}
}

func printDecision(dec decision) error {
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	return enc.Encode(dec)
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, "error:", err)
	os.Exit(1)
}

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintf(os.Stderr, "usage: %s <command> [args]\n", os.Args[0])
		os.Exit(1)
	}
	switch os.Args[1] {
	case "test:series":
		if len(os.Args) < 4 {
			fmt.Fprintln(os.Stderr, "usage: test:series <rule.yaml> <series.json>")
			os.Exit(1)
		}
		rule, err := compileFromYAML(os.Args[2])
		if err != nil {
			fatal(err)
		}
		data, err := os.ReadFile(os.Args[3])
		if err != nil {
			fatal(err)
		}
		var ser series
		if err := json.Unmarshal(data, &ser); err != nil {
			fatal(err)
		}
		dec, err := evaluateRuleForSeries(rule, ser)
		if err != nil {
			fatal(err)
		}
		if err := printDecision(dec); err != nil {
			fatal(err)
		}
	default:
		fmt.Fprintf(os.Stderr, "unknown command %q\n", os.Args[1])
		os.Exit(1)
	}
}
