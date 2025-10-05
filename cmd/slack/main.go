package main

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	defaultListenAddr = ":8082"
	commandPath       = "/slack/command"
	interactPath      = "/slack/interact"
	signatureVersion  = "v0"
	maxSlackSkew      = 5 * time.Minute
)

var (
	signingSecret        = os.Getenv("SLACK_SIGNING_SECRET")
	exceptionsServiceURL = strings.TrimSuffix(getenv("EXCEPTIONS_SERVICE_URL", "http://localhost:8081"), "/")
	httpClient           = &http.Client{Timeout: 10 * time.Second}
)

func main() {
	addr := getenv("SLACK_GATEWAY_ADDR", defaultListenAddr)
	mux := http.NewServeMux()
	mux.HandleFunc(commandPath, slashCommand)
	mux.HandleFunc(interactPath, interact)

	log.Printf("Slack gateway listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

func slashCommand(w http.ResponseWriter, r *http.Request) {
	if err := verifySlack(r); err != nil {
		log.Printf("slash command signature verification failed: %v", err)
		http.Error(w, "bad signature", http.StatusUnauthorized)
		return
	}
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}

	user := or(r.FormValue("user_name"), r.FormValue("user_id"))
	args := parseKV(strings.TrimSpace(r.FormValue("text")))

	rule := args["rule"]
	subject := args["subject"]
	org := args["org"]
	reason := args["reason"]
	until := args["until"]

	if rule == "" || subject == "" || org == "" {
		http.Error(w, "missing required arguments: rule, subject, org", http.StatusBadRequest)
		return
	}

	subjectType, subjectID, err := splitSubject(subject)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if until != "" {
		if _, err := time.Parse(time.RFC3339, until); err != nil {
			http.Error(w, "until must be RFC3339", http.StatusBadRequest)
			return
		}
	}

	payload := url.Values{
		"rule_id":      {rule},
		"org_id":       {org},
		"subject_type": {subjectType},
		"subject_id":   {subjectID},
		"requested_by": {user},
		"reason":       {reason},
	}
	if until != "" {
		payload.Set("valid_until", until)
	}

	endpoint := exceptionsServiceURL + "/exceptions"
	req, err := http.NewRequestWithContext(r.Context(), http.MethodPost, endpoint, strings.NewReader(payload.Encode()))
	if err != nil {
		http.Error(w, "failed to create request", http.StatusInternalServerError)
		return
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := httpClient.Do(req)
	if err != nil {
		log.Printf("exceptions create request failed: %v", err)
		http.Error(w, "upstream error", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("exceptions create returned %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
		http.Error(w, "exceptions service rejected request", http.StatusBadGateway)
		return
	}

	excID, err := parseExceptionID(resp.Body)
	if err != nil {
		log.Printf("failed to read exceptions response: %v", err)
		http.Error(w, "invalid response from exceptions service", http.StatusBadGateway)
		return
	}

	msg := approvalBlock(rule, org, subjectType, subjectID, reason, until, excID, user)
	writeJSON(w, msg)
}

func interact(w http.ResponseWriter, r *http.Request) {
	if err := verifySlack(r); err != nil {
		log.Printf("interaction signature verification failed: %v", err)
		http.Error(w, "bad signature", http.StatusUnauthorized)
		return
	}
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}

	payload := r.FormValue("payload")
	if payload == "" {
		http.Error(w, "missing payload", http.StatusBadRequest)
		return
	}

	var p struct {
		User struct {
			Username string `json:"username"`
			ID       string `json:"id"`
			Name     string `json:"name"`
		} `json:"user"`
		Actions []struct {
			ActionID string `json:"action_id"`
			Value    string `json:"value"`
		} `json:"actions"`
		ResponseURL string `json:"response_url"`
	}

	if err := json.Unmarshal([]byte(payload), &p); err != nil {
		http.Error(w, "invalid payload", http.StatusBadRequest)
		return
	}
	if len(p.Actions) == 0 {
		w.WriteHeader(http.StatusOK)
		return
	}

	ctx := map[string]string{}
	if err := json.Unmarshal([]byte(p.Actions[0].Value), &ctx); err != nil {
		http.Error(w, "invalid action context", http.StatusBadRequest)
		return
	}

	actor := or(p.User.Username, or(p.User.Name, p.User.ID))
	actionID := p.Actions[0].ActionID
	exceptionID := ctx["exc_id"]
	if exceptionID == "" {
		http.Error(w, "missing exception id", http.StatusBadRequest)
		return
	}

	switch actionID {
	case "approve":
		if err := approveException(r.Context(), exceptionID, actor); err != nil {
			log.Printf("approve failed: %v", err)
			http.Error(w, "approval failed", http.StatusBadGateway)
			return
		}
		postResponseUpdate(p.ResponseURL, fmt.Sprintf(":white_check_mark: Exception *%s* approved by *%s* (24h)", ctx["rule_id"], actor))
	case "deny":
		if err := denyException(r.Context(), exceptionID, actor); err != nil {
			log.Printf("deny failed: %v", err)
			http.Error(w, "deny failed", http.StatusBadGateway)
			return
		}
		postResponseUpdate(p.ResponseURL, fmt.Sprintf(":no_entry: Exception *%s* denied by *%s*", ctx["rule_id"], actor))
	default:
		http.Error(w, "unknown action", http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func approveException(ctx context.Context, id, actor string) error {
	payload := url.Values{
		"actor":       {actor},
		"valid_until": {time.Now().Add(24 * time.Hour).UTC().Format(time.RFC3339)},
	}
	return postExceptionForm(ctx, "/exceptions/"+id+"/approve", payload)
}

func denyException(ctx context.Context, id, actor string) error {
	payload := url.Values{
		"actor": {actor},
	}
	return postExceptionForm(ctx, "/exceptions/"+id+"/deny", payload)
}

func postExceptionForm(ctx context.Context, path string, payload url.Values) error {
	endpoint := exceptionsServiceURL + path
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, strings.NewReader(payload.Encode()))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	io.Copy(io.Discard, resp.Body)
	if resp.StatusCode >= 300 {
		return fmt.Errorf("exceptions service returned %d", resp.StatusCode)
	}
	return nil
}

func postResponseUpdate(urlStr, text string) {
	if urlStr == "" {
		return
	}
	body := map[string]any{
		"replace_original": true,
		"text":             text,
	}
	data, err := json.Marshal(body)
	if err != nil {
		log.Printf("failed to marshal response update: %v", err)
		return
	}
	req, err := http.NewRequest(http.MethodPost, urlStr, bytes.NewReader(data))
	if err != nil {
		log.Printf("failed to create response update request: %v", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := httpClient.Do(req)
	if err != nil {
		log.Printf("response update failed: %v", err)
		return
	}
	defer resp.Body.Close()
	io.Copy(io.Discard, resp.Body)
	if resp.StatusCode >= 300 {
		log.Printf("response update returned %d", resp.StatusCode)
	}
}

func parseExceptionID(body io.Reader) (string, error) {
	dec := json.NewDecoder(body)
	dec.UseNumber()
	var payload any
	if err := dec.Decode(&payload); err != nil {
		return "", err
	}
	if id := findID(payload); id != "" {
		return id, nil
	}
	return "", errors.New("missing id in response")
}

func findID(v any) string {
	switch val := v.(type) {
	case map[string]any:
		if id := normalizeID(val["id"]); id != "" {
			return id
		}
		if nested, ok := val["exception"]; ok {
			if id := findID(nested); id != "" {
				return id
			}
		}
		if nested, ok := val["data"]; ok {
			if id := findID(nested); id != "" {
				return id
			}
		}
		for _, nested := range val {
			if id := findID(nested); id != "" {
				return id
			}
		}
	case []any:
		for _, item := range val {
			if id := findID(item); id != "" {
				return id
			}
		}
	case json.Number:
		return val.String()
	case string:
		return val
	}
	return ""
}

func normalizeID(v any) string {
	switch val := v.(type) {
	case string:
		return val
	case json.Number:
		return val.String()
	case float64:
		return strconv.FormatInt(int64(val), 10)
	}
	return ""
}

func approvalBlock(rule, org, subjectType, subjectID, reason, until, excID, requestedBy string) map[string]any {
	if until == "" {
		until = "(none)"
	}
	if reason == "" {
		reason = "(not provided)"
	}
	ctx := map[string]string{
		"exc_id":       excID,
		"rule_id":      rule,
		"org_id":       org,
		"subject_type": subjectType,
		"subject_id":   subjectID,
	}
	value, _ := json.Marshal(ctx)
	text := fmt.Sprintf("*Rule:* `%s`\n*Subject:* `%s:%s`\n*Org:* `%s`\n*Until:* `%s`\n*Requested by:* `%s`\n*Reason:* %s", rule, subjectType, subjectID, org, until, requestedBy, reason)
	return map[string]any{
		"response_type": "ephemeral",
		"text":          ":shield: Exception request submitted",
		"blocks": []any{
			section(text),
			actionRow(string(value)),
		},
	}
}

func section(text string) map[string]any {
	return map[string]any{
		"type": "section",
		"text": map[string]any{
			"type": "mrkdwn",
			"text": text,
		},
	}
}

func actionRow(value string) map[string]any {
	return map[string]any{
		"type": "actions",
		"elements": []any{
			button("Approve", "primary", "approve", value),
			button("Deny", "danger", "deny", value),
		},
	}
}

func button(text, style, actionID, value string) map[string]any {
	return map[string]any{
		"type": "button",
		"text": map[string]any{
			"type": "plain_text",
			"text": text,
		},
		"style":     style,
		"action_id": actionID,
		"value":     value,
	}
}

func parseKV(input string) map[string]string {
	result := make(map[string]string)
	i := 0
	for i < len(input) {
		for i < len(input) && input[i] == ' ' {
			i++
		}
		if i >= len(input) {
			break
		}
		start := i
		for i < len(input) && input[i] != '=' {
			i++
		}
		if i >= len(input) {
			break
		}
		key := strings.TrimSpace(input[start:i])
		i++
		if i >= len(input) {
			result[key] = ""
			break
		}
		var value strings.Builder
		if input[i] == '"' || input[i] == '\'' {
			quote := input[i]
			i++
			for i < len(input) {
				ch := input[i]
				if ch == '\\' && i+1 < len(input) {
					value.WriteByte(input[i+1])
					i += 2
					continue
				}
				if ch == quote {
					i++
					break
				}
				value.WriteByte(ch)
				i++
			}
		} else {
			for i < len(input) && input[i] != ' ' {
				value.WriteByte(input[i])
				i++
			}
		}
		result[key] = strings.TrimSpace(value.String())
	}
	return result
}

func splitSubject(subject string) (string, string, error) {
	parts := strings.SplitN(subject, ":", 2)
	if len(parts) != 2 {
		return "", "", errors.New("subject must be type:id")
	}
	if parts[0] == "" || parts[1] == "" {
		return "", "", errors.New("subject must be type:id")
	}
	return parts[0], parts[1], nil
}

func verifySlack(r *http.Request) error {
	if signingSecret == "" {
		return nil
	}
	timestamp := r.Header.Get("X-Slack-Request-Timestamp")
	if timestamp == "" {
		return errors.New("missing slack timestamp")
	}
	ts, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		return fmt.Errorf("invalid slack timestamp: %w", err)
	}
	diff := time.Since(time.Unix(ts, 0))
	if diff > maxSlackSkew || diff < -maxSlackSkew {
		return errors.New("timestamp outside tolerance")
	}
	sig := r.Header.Get("X-Slack-Signature")
	if sig == "" {
		return errors.New("missing slack signature")
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		return fmt.Errorf("read body: %w", err)
	}
	r.Body.Close()
	r.Body = io.NopCloser(bytes.NewReader(body))

	base := fmt.Sprintf("%s:%s:%s", signatureVersion, timestamp, string(body))
	mac := hmac.New(sha256.New, []byte(signingSecret))
	mac.Write([]byte(base))
	expected := signatureVersion + "=" + fmt.Sprintf("%x", mac.Sum(nil))
	if !hmac.Equal([]byte(expected), []byte(sig)) {
		return errors.New("signature mismatch")
	}
	return nil
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("failed to write json: %v", err)
	}
}

func or(a, b string) string {
	if a != "" {
		return a
	}
	return b
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
