package exceptions

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"
)

var errRuleIDRequired = errors.New("exceptions: rule_id is required")

// ActiveException captures the JSON shape for GET /exceptions/active responses.
type ActiveException struct {
	ID          int64      `json:"id"`
	SubjectType string     `json:"subject_type"`
	SubjectID   string     `json:"subject_id"`
	RequestedBy string     `json:"requested_by"`
	ValidUntil  *time.Time `json:"valid_until,omitempty"`
}

// ListActiveExceptions returns approved exceptions for a rule (optionally filtered by org).
func (s *Service) ListActiveExceptions(ctx context.Context, ruleID, orgID string) ([]ActiveException, error) {
	ruleID = strings.TrimSpace(ruleID)
	if ruleID == "" {
		return nil, errRuleIDRequired
	}
	orgID = strings.TrimSpace(orgID)

	query := strings.Builder{}
	query.WriteString("SELECT id, subject_type, subject_id, requested_by, valid_until FROM exceptions WHERE status='approved'")
	var args []any
	query.WriteString(" AND rule_id=")
	query.WriteString(s.placeholder(len(args) + 1))
	args = append(args, ruleID)
	if orgID != "" {
		query.WriteString(" AND org_id=")
		query.WriteString(s.placeholder(len(args) + 1))
		args = append(args, orgID)
	}
	query.WriteString(" ORDER BY valid_until ASC")

	rows, err := s.DB.QueryContext(ctx, query.String(), args...)
	if err != nil {
		return nil, fmt.Errorf("exceptions: query active exceptions: %w", err)
	}
	defer rows.Close()

	var out []ActiveException
	for rows.Next() {
		var (
			rec    ActiveException
			valid  any
			reqStr sql.NullString
		)
		if err := rows.Scan(&rec.ID, &rec.SubjectType, &rec.SubjectID, &reqStr, &valid); err != nil {
			return nil, fmt.Errorf("exceptions: scan active exception: %w", err)
		}
		rec.RequestedBy = reqStr.String
		ts, err := parseTimeValue(valid)
		if err != nil {
			return nil, err
		}
		rec.ValidUntil = ts
		out = append(out, rec)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

// HandleActive exposes GET /exceptions/active.
func (s *Service) HandleActive() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ruleID := r.URL.Query().Get("rule_id")
		orgID := r.URL.Query().Get("org_id")
		ctx := r.Context()
		items, err := s.ListActiveExceptions(ctx, ruleID, orgID)
		if err != nil {
			if errors.Is(err, errRuleIDRequired) {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		writeJSON(w, map[string]any{"items": items})
	}
}

func writeJSON(w http.ResponseWriter, payload any) {
	w.Header().Set("Content-Type", "application/json")
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	if err := enc.Encode(payload); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
