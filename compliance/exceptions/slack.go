package exceptions

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// SlackAPIPoster posts payloads to Slack's chat.postMessage API using a bot token.
type SlackAPIPoster struct {
	Client *http.Client
	Token  string
}

// PostMessage implements SlackPoster.
func (p SlackAPIPoster) PostMessage(ctx context.Context, payload map[string]any) (SlackMessageResponse, error) {
	if payload == nil {
		return SlackMessageResponse{}, fmt.Errorf("exceptions: slack payload is required")
	}
	client := p.Client
	if client == nil {
		client = http.DefaultClient
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return SlackMessageResponse{}, fmt.Errorf("exceptions: marshal slack payload: %w", err)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://slack.com/api/chat.postMessage", bytes.NewReader(body))
	if err != nil {
		return SlackMessageResponse{}, fmt.Errorf("exceptions: create slack request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if p.Token != "" {
		req.Header.Set("Authorization", "Bearer "+p.Token)
	}
	resp, err := client.Do(req)
	if err != nil {
		return SlackMessageResponse{}, fmt.Errorf("exceptions: post to slack: %w", err)
	}
	defer resp.Body.Close()
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return SlackMessageResponse{}, fmt.Errorf("exceptions: read slack response: %w", err)
	}
	if resp.StatusCode >= 300 {
		return SlackMessageResponse{}, fmt.Errorf("exceptions: slack http %d: %s", resp.StatusCode, string(respBody))
	}
	var out struct {
		OK      bool   `json:"ok"`
		Error   string `json:"error"`
		Channel string `json:"channel"`
		Ts      string `json:"ts"`
	}
	if err := json.Unmarshal(respBody, &out); err != nil {
		return SlackMessageResponse{}, fmt.Errorf("exceptions: decode slack response: %w", err)
	}
	if !out.OK {
		if out.Error == "" {
			out.Error = "unknown_error"
		}
		return SlackMessageResponse{}, fmt.Errorf("exceptions: slack error %s", out.Error)
	}
	return SlackMessageResponse{Channel: out.Channel, Timestamp: out.Ts}, nil
}
