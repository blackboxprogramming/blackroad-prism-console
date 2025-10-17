package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"

	"github.com/blackroad/prism-console/compliance/harness"
)

func main() {
	if len(os.Args) < 2 {
		usage()
	}

	switch os.Args[1] {
	case "test:mirror":
		cr := must(harness.CompileMirror())
		runFixtureEvent(cr, "fixtures/mirror/deny_secret.json")
		runFixtureEvent(cr, "fixtures/mirror/allow_internal.json")
	default:
		usage()
	}
}

func runFixtureEvent(cr harness.CompiledRule, path string) {
	data := must(readFile(path))
	ev := map[string]any{}
	must(0, json.Unmarshal(data, &ev))
	dec, err := harness.EvaluateEvent(cr, ev)
	if err != nil {
		panic(err)
	}
	_ = harness.EnforceOrNotify(cr, dec)
	harness.PrintDecision(dec)
}

func usage() {
	fmt.Fprintf(os.Stderr, "usage: %s <command>\n", os.Args[0])
	fmt.Fprintln(os.Stderr, "commands:")
	fmt.Fprintln(os.Stderr, "  test:mirror    Evaluate mirror fixtures")
	os.Exit(2)
}

func must[T any](val T, err error) T {
	if err != nil {
		panic(err)
	}
	return val
}

func readFile(path string) ([]byte, error) {
	data, err := os.ReadFile(path)
	if err == nil {
		return data, nil
	}
	if errors.Is(err, os.ErrNotExist) {
		return os.ReadFile(filepath.Join("..", path))
	}
	return nil, err
}
