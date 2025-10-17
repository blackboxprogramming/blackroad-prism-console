package test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
	"time"
)

var (
	composeStarted bool
)

func TestAPIHealthFlow(t *testing.T) {
	ensureCompose(t)
	resp, err := http.Get("http://localhost:4000/api/health.json")
	if err != nil {
		t.Fatalf("request health: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("unexpected status: %d", resp.StatusCode)
	}
	var body map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if body["status"] != "ok" {
		t.Fatalf("unexpected status value: %v", body["status"])
	}
}

func TestAPIEchoFlow(t *testing.T) {
	ensureCompose(t)
	payload := map[string]string{"hello": "world"}
	buf, _ := json.Marshal(payload)
	resp, err := http.Post("http://localhost:4000/api/echo", "application/json", bytes.NewReader(buf))
	if err != nil {
		t.Fatalf("post echo: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("unexpected status: %d", resp.StatusCode)
	}
	var body map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	received := body["received"].(map[string]interface{})
	if received["hello"] != "world" {
		t.Fatalf("unexpected echo payload: %v", received)
	}
}

func TestAPIMiniInferFlow(t *testing.T) {
	ensureCompose(t)
	payload := map[string]float64{"x": 8, "y": 9}
	buf, _ := json.Marshal(payload)
	resp, err := http.Post("http://localhost:4000/api/mini/infer", "application/json", bytes.NewReader(buf))
	if err != nil {
		t.Fatalf("post mini infer: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("unexpected status: %d", resp.StatusCode)
	}
	var body map[string]float64
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if body["output"] != 72 {
		t.Fatalf("unexpected output: %v", body["output"])
	}
}

func ensureCompose(t *testing.T) {
	t.Helper()
	if !composeStarted {
		startCompose(t)
		composeStarted = true
	}
}

func startCompose(t *testing.T) {
	t.Helper()
	if _, err := exec.LookPath("docker"); err != nil {
		t.Skip("docker is required for integration tests")
	}
	composeFile := filepath.Join("..", "..", "..", "docker-compose.prism.yml")
	cmd := exec.Command("docker", "compose", "-f", composeFile, "up", "-d", "api")
	if out, err := cmd.CombinedOutput(); err != nil {
		t.Skipf("failed to start docker compose: %v\n%s", err, string(out))
	}
	t.Cleanup(func() {
		cmd := exec.Command("docker", "compose", "-f", composeFile, "down", "-v")
		_ = cmd.Run()
		composeStarted = false
	})
	waitForAPI(t)
}

func waitForAPI(t *testing.T) {
	t.Helper()
	deadline := time.Now().Add(30 * time.Second)
	for time.Now().Before(deadline) {
		resp, err := http.Get("http://localhost:4000/api/health.json")
		if err == nil {
			resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				return
			}
		}
		time.Sleep(1 * time.Second)
	}
	t.Fatal("API did not become ready within timeout")
}

func TestMain(m *testing.M) {
	code := m.Run()
	if composeStarted {
		composeFile := filepath.Join("..", "..", "..", "docker-compose.prism.yml")
		cmd := exec.Command("docker", "compose", "-f", composeFile, "down", "-v")
		_ = cmd.Run()
	}
	os.Exit(code)
}
