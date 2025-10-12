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
	"sync"
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
	slackBotToken        = os.Getenv("SLACK_BOT_TOKEN")
	httpClient           = &http.Client{Timeout: 10 * time.Second}
	secopsApprovers      = parseList(os.Getenv("SECOPS_APPROVERS"))
)

const (
	adminPageSize   = 6
	adminMaxPage    = 9999
	adminFallbackTS = "Active exceptions"
)

type adminContext struct {
	RuleID     string
	OrgID      string
	Page       int
	TotalPages int
}

type activeException struct {
	ID          int64      `json:"id"`
	RuleID      string     `json:"rule_id"`
	OrgID       string     `json:"org_id"`
	SubjectType string     `json:"subject_type"`
	SubjectID   string     `json:"subject_id"`
	RequestedBy string     `json:"requested_by"`
	ValidFrom   *time.Time `json:"valid_from"`
	ValidUntil  *time.Time `json:"valid_until"`
}

type activeExceptionsResponse struct {
        Exceptions []activeException `json:"exceptions"`
        Page       int               `json:"page"`
        TotalPages int               `json:"totalPages"`
        Total      int               `json:"total"`
        PageSize   int               `json:"pageSize"`
}

var adminMessages = struct {
	sync.Mutex
	store map[string]adminContext
}{store: make(map[string]adminContext)}

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
	userID := r.FormValue("user_id")
	args := parseKV(strings.TrimSpace(r.FormValue("text")))

	if view := strings.ToLower(args["view"]); view == "admin" || view == "active" {
		if !canAdmin(userID) {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}
		if slackBotToken == "" {
			http.Error(w, "slack bot token not configured", http.StatusInternalServerError)
			return
		}
		if err := handleAdminList(r.Context(), r, args); err != nil {
			log.Printf("admin list failed: %v", err)
			http.Error(w, "failed to post admin view", http.StatusInternalServerError)
			return
		}
		writeJSON(w, map[string]any{
			"response_type": "ephemeral",
			"text":          "Posted active exceptions snapshot.",
		})
		return
	}

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
		Container struct {
			ChannelID string `json:"channel_id"`
			MessageTs string `json:"message_ts"`
		} `json:"container"`
		Message struct {
			Ts      string `json:"ts"`
			Channel string `json:"channel"`
		} `json:"message"`
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

	switch actionID {
	case "approve":
		exceptionID := ctx["exc_id"]
		if exceptionID == "" {
			http.Error(w, "missing exception id", http.StatusBadRequest)
			return
		}
		if err := approveException(r.Context(), exceptionID, actor); err != nil {
			log.Printf("approve failed: %v", err)
			http.Error(w, "approval failed", http.StatusBadGateway)
			return
		}
		postResponseUpdate(p.ResponseURL, fmt.Sprintf(":white_check_mark: Exception *%s* approved by *%s* (24h)", ctx["rule_id"], actor))
		w.WriteHeader(http.StatusOK)
		return
	case "deny":
		exceptionID := ctx["exc_id"]
		if exceptionID == "" {
			http.Error(w, "missing exception id", http.StatusBadRequest)
			return
		}
		if err := denyException(r.Context(), exceptionID, actor); err != nil {
			log.Printf("deny failed: %v", err)
			http.Error(w, "deny failed", http.StatusBadGateway)
			return
		}
		postResponseUpdate(p.ResponseURL, fmt.Sprintf(":no_entry: Exception *%s* denied by *%s*", ctx["rule_id"], actor))
		w.WriteHeader(http.StatusOK)
		return
	case "page_prev", "page_next":
		if !canAdmin(p.User.ID) {
			postResponseUpdate(p.ResponseURL, ":no_entry: You are not allowed to update the admin view.")
			w.WriteHeader(http.StatusOK)
			return
		}
		if slackBotToken == "" {
			http.Error(w, "slack bot token not configured", http.StatusInternalServerError)
			return
		}
		if err := handlePagerAction(r.Context(), actionID, ctx, p.Container.ChannelID, firstNonEmpty(p.Container.MessageTs, p.Message.Ts)); err != nil {
			log.Printf("pager update failed: %v", err)
			http.Error(w, "failed to update view", http.StatusBadGateway)
			return
		}
		w.WriteHeader(http.StatusOK)
		return
	default:
		http.Error(w, "unknown action", http.StatusBadRequest)
		return
	}
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
	btn := map[string]any{
		"type": "button",
		"text": map[string]any{
			"type": "plain_text",
			"text": text,
		},
		"style":     style,
		"action_id": actionID,
		"value":     value,
	}
	if style == "danger" {
		prompt := fmt.Sprintf("This will %s the exception immediately.", strings.ToLower(text))
		btn["confirm"] = map[string]any{
			"title":   map[string]any{"type": "plain_text", "text": "Are you sure?"},
			"text":    map[string]any{"type": "plain_text", "text": prompt},
			"confirm": map[string]any{"type": "plain_text", "text": text},
			"deny":    map[string]any{"type": "plain_text", "text": "Cancel"},
		}
	}
	return btn
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

func parseList(raw string) []string {
	if raw == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}

func canAdmin(userID string) bool {
	if userID == "" {
		return false
	}
	for _, allowed := range secopsApprovers {
		if allowed == userID {
			return true
		}
	}
	return false
}

func handleAdminList(ctx context.Context, r *http.Request, args map[string]string) error {
	channelID := r.FormValue("channel_id")
	page := clampPage(atoiOr(args["page"], 1))
	filters := adminContext{
		RuleID: strings.TrimSpace(args["rule"]),
		OrgID:  strings.TrimSpace(args["org"]),
		Page:   page,
	}

	resp, meta, err := buildAdminMessage(ctx, channelID, filters)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("slack returned %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	var slackResp struct {
		Ok      bool   `json:"ok"`
		Channel string `json:"channel"`
		Ts      string `json:"ts"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&slackResp); err != nil {
		return fmt.Errorf("decode slack response: %w", err)
	}
	if !slackResp.Ok {
		return fmt.Errorf("slack response not ok")
	}
	filters.TotalPages = meta.TotalPages
	storeAdminContext(slackResp.Channel, slackResp.Ts, filters)
	return nil
}

type adminMeta struct {
	Page       int
	TotalPages int
}

func buildAdminMessage(ctx context.Context, channelID string, filters adminContext) (*http.Response, adminMeta, error) {
	blocks, meta, err := renderAdminBlocks(ctx, filters.RuleID, filters.OrgID, filters.Page)
	if err != nil {
		return nil, adminMeta{}, err
	}
	payload := map[string]any{
		"channel": channelID,
		"text":    adminFallbackTS,
		"blocks":  blocks,
	}
	resp, err := postSlackAPI("chat.postMessage", payload)
	if err != nil {
		return nil, adminMeta{}, err
	}
	return resp, meta, nil
}

func handlePagerAction(ctx context.Context, actionID string, payload map[string]string, channelID, ts string) error {
	current := atoiOr(payload["page"], 1)
	ruleID := payload["rule_id"]
	orgID := payload["org_id"]
	if channelID == "" || ts == "" {
		return errors.New("missing message identity")
	}
	var target int
	if actionID == "page_prev" {
		target = clampPage(current - 1)
	} else {
		target = clampPage(current + 1)
	}

	blocks, meta, err := renderAdminBlocks(ctx, ruleID, orgID, target)
	if err != nil {
		return err
	}
	body := map[string]any{
		"channel": channelID,
		"ts":      ts,
		"text":    adminFallbackTS,
		"blocks":  blocks,
	}
	resp, err := postSlackAPI("chat.update", body)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		data, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("slack update returned %d: %s", resp.StatusCode, strings.TrimSpace(string(data)))
	}
	filters := adminContext{RuleID: ruleID, OrgID: orgID, Page: meta.Page, TotalPages: meta.TotalPages}
	storeAdminContext(channelID, ts, filters)
	return nil
}

func renderAdminBlocks(ctx context.Context, ruleID, orgID string, page int) ([]map[string]any, adminMeta, error) {
	resp, err := fetchActiveExceptions(ctx, ruleID, orgID, page, adminPageSize)
	if err != nil {
		return nil, adminMeta{}, err
	}
	if resp.TotalPages == 0 {
		resp.TotalPages = 1
	}
	if page > resp.TotalPages {
		// clamp and refetch
		resp, err = fetchActiveExceptions(ctx, ruleID, orgID, resp.TotalPages, adminPageSize)
		if err != nil {
			return nil, adminMeta{}, err
		}
		page = resp.Page
	}
	header := "*Active exceptions*"
	if ruleID != "" || orgID != "" {
		parts := []string{}
		if ruleID != "" {
			parts = append(parts, fmt.Sprintf("rule `%s`", ruleID))
		}
		if orgID != "" {
			parts = append(parts, fmt.Sprintf("org `%s`", orgID))
		}
		header += " — " + strings.Join(parts, ", ")
	}

	blocks := []map[string]any{
		sectionBlock(header),
	}
	if len(resp.Exceptions) == 0 {
		blocks = append(blocks, sectionBlock("(no active exceptions)"))
	} else {
		for _, item := range resp.Exceptions {
			blocks = append(blocks, sectionBlock(renderExceptionLine(item)))
		}
	}

	pageInfo := fmt.Sprintf("Page %d of %d", resp.Page, resp.TotalPages)
	blocks = append(blocks, contextBlock(pageInfo))

	buttons := []map[string]any{}
	if resp.Page > 1 {
		buttons = append(buttons, buttonWithStyle("◀ Prev", "primary", "page_prev", encodeCtxPage(resp.Page-1, ruleID, orgID)))
	}
	if resp.Page < resp.TotalPages {
		buttons = append(buttons, buttonWithStyle("Next ▶", "primary", "page_next", encodeCtxPage(resp.Page+1, ruleID, orgID)))
	}
	if len(buttons) > 0 {
		blocks = append(blocks, map[string]any{
			"type":     "actions",
			"elements": buttons,
		})
	}
	return blocks, adminMeta{Page: resp.Page, TotalPages: resp.TotalPages}, nil
}

func renderExceptionLine(item activeException) string {
	subject := fmt.Sprintf("%s:%s", item.SubjectType, item.SubjectID)
	until := "(none)"
	if item.ValidUntil != nil {
		until = item.ValidUntil.UTC().Format(time.RFC3339)
	}
	from := "(unspecified)"
	if item.ValidFrom != nil {
		from = item.ValidFrom.UTC().Format(time.RFC3339)
	}
	remaining := humanizeRemaining(item.ValidUntil)
	return fmt.Sprintf("*Rule:* `%s`\n*Subject:* `%s`\n*Org:* `%s`\n*Window:* %s → %s\n*Requested by:* %s\n*Remaining:* %s", item.RuleID, subject, item.OrgID, from, until, or(item.RequestedBy, "unknown"), remaining)
}

func humanizeRemaining(until *time.Time) string {
	if until == nil {
		return "(no expiry)"
	}
	diff := time.Until(*until)
	if diff <= 0 {
		return "expired"
	}
	hrs := diff / time.Hour
	mins := (diff % time.Hour) / time.Minute
	return fmt.Sprintf("%dh %dm", hrs, mins)
}

func sectionBlock(text string) map[string]any {
	return map[string]any{
		"type": "section",
		"text": map[string]any{
			"type": "mrkdwn",
			"text": text,
		},
	}
}

func contextBlock(text string) map[string]any {
	return map[string]any{
		"type": "context",
		"elements": []any{
			map[string]any{"type": "mrkdwn", "text": text},
		},
	}
}

func buttonWithStyle(text, style, actionID, value string) map[string]any {
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

func postSlackAPI(method string, payload map[string]any) (*http.Response, error) {
	if slackBotToken == "" {
		return nil, errors.New("slack bot token not configured")
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequest(http.MethodPost, "https://slack.com/api/"+method, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json; charset=utf-8")
	req.Header.Set("Authorization", "Bearer "+slackBotToken)
	return httpClient.Do(req)
}

func fetchActiveExceptions(ctx context.Context, ruleID, orgID string, page, pageSize int) (activeExceptionsResponse, error) {
	params := url.Values{}
	params.Set("page", strconv.Itoa(clampPage(page)))
	params.Set("page_size", strconv.Itoa(pageSize))
	if ruleID != "" {
		params.Set("rule_id", ruleID)
	}
	if orgID != "" {
		params.Set("org_id", orgID)
	}
	endpoint := exceptionsServiceURL + "/exceptions/active?" + params.Encode()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return activeExceptionsResponse{}, err
	}
	req.Header.Set("Accept", "application/json")
	resp, err := httpClient.Do(req)
	if err != nil {
		return activeExceptionsResponse{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		data, _ := io.ReadAll(resp.Body)
		return activeExceptionsResponse{}, fmt.Errorf("exceptions service returned %d: %s", resp.StatusCode, strings.TrimSpace(string(data)))
	}
	var payload activeExceptionsResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return activeExceptionsResponse{}, err
	}
	if payload.Page == 0 {
		payload.Page = 1
	}
	return payload, nil
}

func encodeCtxPage(page int, ruleID, orgID string) string {
	ctx := map[string]string{
		"page": strconv.Itoa(clampPage(page)),
	}
	if ruleID != "" {
		ctx["rule_id"] = ruleID
	}
	if orgID != "" {
		ctx["org_id"] = orgID
	}
	b, _ := json.Marshal(ctx)
	return string(b)
}

func clampPage(page int) int {
	if page < 1 {
		return 1
	}
	if page > adminMaxPage {
		return adminMaxPage
	}
	return page
}

func atoiOr(value string, fallback int) int {
	if value == "" {
		return fallback
	}
	n, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return n
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}

func storeAdminContext(channel, ts string, ctx adminContext) {
	if channel == "" || ts == "" {
		return
	}
	adminMessages.Lock()
	adminMessages.store[messageKey(channel, ts)] = ctx
	adminMessages.Unlock()
}

func messageKey(channel, ts string) string {
	return channel + "::" + ts
}
