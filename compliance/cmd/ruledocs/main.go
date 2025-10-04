package main

import (
	"bytes"
	"fmt"
	"html/template"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/blackroad/prism-console/compliance/harness"
)

const mdTemplate = `---
title: "{{ .Name }}"
rule_id: "{{ .RuleID }}"
category: "{{ .Category }}"
severity: "{{ .Severity }}"
version: {{ .Version }}
owners:
{{- if .Owners }}
{{- range .Owners }}
  - "{{ . }}"
{{- end }}
{{- else }}
  []
{{- end }}
---

# {{ .Name }}

**Rule ID:** ` + "`{{ .RuleID }}`" + `  
**Category:** {{ .Category }}  
**Severity:** {{ .Severity }}  
**Version:** {{ .Version }}

{{- if .Description }}
## What it does
{{ .Description }}
{{- end }}

{{- if .OnMatch.Decision }}
## Decision on match
- **decision:** ` + "`{{ .OnMatch.Decision }}`" + `
{{- if .OnMatch.Reason }}
- **reason:** ` + "`{{ .OnMatch.Reason }}`" + `
{{- end }}
{{- if .OnMatch.Details }}
{{- if index .OnMatch.Details "message" }}
- **message:** {{ index .OnMatch.Details "message" }}
{{- end }}
{{- if index .OnMatch.Details "remediation" }}
- **remediation:** {{ index .OnMatch.Details "remediation" }}
{{- end }}
{{- end }}
{{- end }}

## Inputs
{{- if .InputsSchema }}
{{- range .InputsSchema }}
- ` + "`{{ .Name }}`" + `{{ if .Description }} — {{ .Description }}{{ end }}
{{- end }}
{{- else }}
- _No explicit schema provided._
{{- end }}

{{- if .Expr }}
## Expression
{{ fence "cel" }}
{{ .Expr }}
{{ fence "" }}
{{- end }}

{{- if .MetricsSelector }}
## Metrics selectors
{{- range $key := sortedKeys .MetricsSelector }}
- **{{ $key }}**
{{ fence "" }}
{{ index $.MetricsSelector $key }}
{{ fence "" }}
{{- end }}
{{- end }}

## Examples
{{- if .Tests }}
{{- range .Tests }}
- **{{ .Name }}**{{ if .GUID }} (` + "`{{ .GUID }}`" + `){{ end }}
{{- if .Fixture }}
  - Fixture: ` + "`{{ .Fixture }}`" + `
{{- end }}
{{- if .Window }}
  - Window: ` + "`{{ .Window }}`" + `
{{- end }}
{{- if .Series }}
  - Series:
{{ fence "json" }}
{{ toJSON .Series }}
{{ fence "" }}
{{- end }}
{{- if .Input }}
  - Input:
{{ fence "json" }}
{{ toJSON .Input }}
{{ fence "" }}
{{- end }}
{{- if .Want }}
  - Expected:
{{ fence "json" }}
{{ toJSON .Want }}
{{ fence "" }}
{{- end }}
{{- end }}
{{- else }}
- _No example tests defined._
{{- end }}

{{- if .Owners }}
## Ownership
{{- range .Owners }}
- {{ . }}
{{- end }}
{{- end }}

{{- if .DocsURL }}
[Documentation]({{ .DocsURL }})
{{- end }}
`

func main() {
	if len(os.Args) != 3 {
		log.Fatalf("usage: ruledocs <rules_dir> <out_dir>")
	}

	rulesDir := os.Args[1]
	outDir := os.Args[2]

	entries, err := os.ReadDir(rulesDir)
	if err != nil {
		log.Fatalf("read rules dir: %v", err)
	}

	if err := os.MkdirAll(outDir, 0o755); err != nil {
		log.Fatalf("create output dir: %v", err)
	}

	tpl := template.Must(template.New("rulemd").Funcs(template.FuncMap{
		"toJSON":     harness.ToJSON,
		"sortedKeys": sortedKeys,
		"fence":      fence,
	}).Parse(mdTemplate))

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		if !strings.HasSuffix(entry.Name(), ".yaml") && !strings.HasSuffix(entry.Name(), ".yml") {
			continue
		}
		path := filepath.Join(rulesDir, entry.Name())
		spec, err := harness.LoadRuleYAML(path)
		if err != nil {
			log.Fatalf("parse %s: %v", entry.Name(), err)
		}

		var buf bytes.Buffer
		if err := tpl.Execute(&buf, spec); err != nil {
			log.Fatalf("render %s: %v", entry.Name(), err)
		}

		fname := fmt.Sprintf("%s.md", spec.RuleID)
		if spec.RuleID == "" {
			fname = strings.TrimSuffix(entry.Name(), filepath.Ext(entry.Name())) + ".md"
		}
		outPath := filepath.Join(outDir, fname)
		if err := os.WriteFile(outPath, buf.Bytes(), 0o644); err != nil {
			log.Fatalf("write %s: %v", outPath, err)
		}
		log.Printf("wrote %s", outPath)
	}
}

func sortedKeys(m map[string]string) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}

func fence(lang string) string {
	if lang == "" {
		return "```"
	}
	return "```" + lang
}
