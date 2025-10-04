package exceptions

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strconv"
	"time"
)

// ReminderRow represents an exception row eligible for reminder notifications.
type ReminderRow struct {
	ID           int64
	RuleID       string
	OrgID        string
	SubjectType  string
	SubjectID    string
	ValidUntil   *time.Time
	SlackChannel sql.NullString
	SlackTS      sql.NullString
}

// ReminderResult tracks how many reminders were sent during a sweep.
type ReminderResult struct {
	Sent int
}

// RunReminderSweep locates expiring exceptions within the next reminderWindow and posts Slack reminders.
func (s *Service) RunReminderSweep(ctx context.Context, reminderWindow time.Duration) (ReminderResult, error) {
	if reminderWindow <= 0 {
		reminderWindow = 2 * time.Hour
	}
	rows, err := s.DB.QueryContext(ctx, `
SELECT e.id, e.rule_id, e.org_id, e.subject_type, e.subject_id, e.valid_until, e.slack_channel, e.slack_ts
FROM exceptions e
LEFT JOIN exception_events ev
  ON ev.exception_id = e.id AND ev.action = 'remind'
WHERE e.status = 'approved'
  AND e.valid_until IS NOT NULL
  AND ev.id IS NULL
ORDER BY e.valid_until ASC
`)
	if err != nil {
		return ReminderResult{}, fmt.Errorf("exceptions: query reminders: %w", err)
	}
	defer rows.Close()

	now := s.now().UTC()
	deadline := now.Add(reminderWindow)
	result := ReminderResult{}

	for rows.Next() {
		row, err := scanReminderRow(rows)
		if err != nil {
			return result, err
		}
		if row.ValidUntil == nil {
			continue
		}
		valid := row.ValidUntil.UTC()
		if valid.Before(now) || valid.After(deadline) {
			continue
		}
		if err := s.sendReminder(ctx, row, valid); err != nil {
			return result, err
		}
		result.Sent++
	}
	if err := rows.Err(); err != nil {
		return result, err
	}
	return result, nil
}

func (s *Service) sendReminder(ctx context.Context, row ReminderRow, valid time.Time) error {
	channel := row.SlackChannel.String
	if channel == "" {
		if s.DefaultChannel != "" {
			channel = s.DefaultChannel
		} else {
			channel = "#secops"
		}
	}
	text := fmt.Sprintf(":alarm_clock: *Exception expiring soon* — %s\nClick *Extend 24h* if still needed.", valid.Format(time.RFC3339))
	extendCtx := map[string]string{
		"exc_id":       strconv.FormatInt(row.ID, 10),
		"rule_id":      row.RuleID,
		"org_id":       row.OrgID,
		"subject_type": row.SubjectType,
		"subject_id":   row.SubjectID,
		"hours":        "24",
	}
	revokeCtx := map[string]string{
		"exc_id":       strconv.FormatInt(row.ID, 10),
		"rule_id":      row.RuleID,
		"org_id":       row.OrgID,
		"subject_type": row.SubjectType,
		"subject_id":   row.SubjectID,
	}

	blocks := []any{
		sectionBlock(text),
		map[string]any{
			"type": "actions",
			"elements": []any{
				buttonBlock("Extend 24h", "primary", "extend24", mustJSON(extendCtx)),
				buttonBlock("Revoke", "danger", "revoke", mustJSON(revokeCtx)),
			},
		},
	}
	card := map[string]any{
		"channel": channel,
		"text":    text,
		"blocks":  blocks,
	}
	if row.SlackTS.String != "" {
		card["thread_ts"] = row.SlackTS.String
	}
	if _, err := s.Slack.PostMessage(ctx, card); err != nil {
		return fmt.Errorf("exceptions: post reminder: %w", err)
	}
	insert := fmt.Sprintf(
		"INSERT INTO exception_events(exception_id, actor, action, note) VALUES(%s, 'system', 'remind', '2h prior')",
		s.placeholder(1),
	)
	if _, err := s.DB.ExecContext(ctx, insert, row.ID); err != nil {
		return fmt.Errorf("exceptions: record reminder event: %w", err)
	}
	s.logf("exceptions: reminder queued for id=%d rule=%s", row.ID, row.RuleID)
	return nil
}

func mustJSON(v any) string {
	b, err := json.Marshal(v)
	if err != nil {
		panic(err)
	}
	return string(b)
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

func buttonBlock(label, style, action, value string) map[string]any {
	btn := map[string]any{
		"type": "button",
		"text": map[string]any{
			"type": "plain_text",
			"text": label,
		},
		"action_id": action,
		"value":     value,
	}
	if style != "" {
		btn["style"] = style
	}
	return btn
}

func scanReminderRow(rows interface{ Scan(dest ...any) error }) (ReminderRow, error) {
	var (
		row       ReminderRow
		validRaw  any
		slackChan sql.NullString
		slackTS   sql.NullString
	)
	if err := rows.Scan(&row.ID, &row.RuleID, &row.OrgID, &row.SubjectType, &row.SubjectID, &validRaw, &slackChan, &slackTS); err != nil {
		return row, fmt.Errorf("exceptions: scan reminder row: %w", err)
	}
	ts, err := parseTimeValue(validRaw)
	if err != nil {
		return row, err
	}
	row.ValidUntil = ts
	row.SlackChannel = slackChan
	row.SlackTS = slackTS
	return row, nil
}
