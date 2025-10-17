package harness

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
)

type slackMsg struct {
	Text        string        `json:"text"`
	Blocks      []any         `json:"blocks,omitempty"`
	Attachments []slackAttach `json:"attachments,omitempty"`
}

type slackAttach struct {
	Color  string       `json:"color,omitempty"`
	Fields []slackField `json:"fields,omitempty"`
}

type slackField struct {
	Title string `json:"title"`
	Value string `json:"value"`
	Short bool   `json:"short"`
}

func PostSlackMessage(channel string, payload map[string]any) error {
	webhook := os.Getenv("SLACK_WEBHOOK_URL")
	token := os.Getenv("SLACK_BOT_TOKEN")
	if webhook == "" && token == "" {
		return fmt.Errorf("no slack creds: set SLACK_WEBHOOK_URL or SLACK_BOT_TOKEN")
	}

	text := payload["text"]
	if text == nil {
		text = ":rotating_light: Compliance notification"
	}
	msg := slackMsg{Text: fmt.Sprintf("%v", text)}

	if det, ok := payload["details"].(map[string]any); ok {
		msg.Attachments = []slackAttach{{
			Color: "#d0021b",
			Fields: []slackField{
				{Title: "Rule", Value: getString(payload, "rule_id"), Short: true},
				{Title: "Reason", Value: getString(payload, "reason"), Short: true},
				{Title: "Message", Value: fmt.Sprintf("%v", det["message"]), Short: false},
				{Title: "Remediation", Value: fmt.Sprintf("%v", det["remediation"]), Short: false},
			},
		}}
	}

	if webhook != "" {
		return postWebhook(webhook, msg)
	}
	return postChatAPI(token, channel, msg)
}

func getString(m map[string]any, key string) string {
	if v, ok := m[key]; ok {
		return fmt.Sprintf("%v", v)
	}
	return ""
}

func postWebhook(url string, msg slackMsg) error {
	b, _ := json.Marshal(msg)
	req, _ := http.NewRequest("POST", url, bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode/100 != 2 {
		return fmt.Errorf("slack webhook status %d", resp.StatusCode)
	}
	return nil
}

func postChatAPI(tok, channel string, msg slackMsg) error {
	body := map[string]any{
		"channel": channel,
		"text":    msg.Text,
	}
	if len(msg.Attachments) > 0 {
		var sb strings.Builder
		for _, f := range msg.Attachments[0].Fields {
			if f.Value == "" {
				continue
			}
			sb.WriteString(fmt.Sprintf("*%s*: %s\n", f.Title, f.Value))
		}
		body["text"] = body["text"].(string) + "\n" + sb.String()
	}
	b, _ := json.Marshal(body)
	req, _ := http.NewRequest("POST", "https://slack.com/api/chat.postMessage", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json; charset=utf-8")
	req.Header.Set("Authorization", "Bearer "+tok)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode/100 != 2 {
		return fmt.Errorf("slack api status %d", resp.StatusCode)
	}
	return nil
}
