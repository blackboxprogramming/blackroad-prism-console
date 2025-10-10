package exceptions

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type Server struct {
	db             *sql.DB
	tickerInterval time.Duration
	reminderLead   time.Duration
	reminderWindow time.Duration
	now            func() time.Time
}

func NewServer(db *sql.DB) *Server {
	return &Server{
		db:             db,
		tickerInterval: 15 * time.Minute,
		reminderLead:   24 * time.Hour,
		reminderWindow: 12 * time.Hour,
		now:            func() time.Time { return time.Now().UTC() },
	}
}

func (s *Server) SetTickerInterval(d time.Duration) { s.tickerInterval = d }
func (s *Server) SetReminderLead(d time.Duration)   { s.reminderLead = d }
func (s *Server) SetReminderWindow(d time.Duration) { s.reminderWindow = d }
func (s *Server) SetClock(fn func() time.Time) {
	if fn != nil {
		s.now = fn
	}
}

func (s *Server) Register(mux *http.ServeMux) {
	mux.HandleFunc("/exceptions/", s.routeExceptions)
	mux.HandleFunc("/exceptions/active", s.handleActive)
}

func (s *Server) routeExceptions(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/exceptions/")
	parts := strings.Split(path, "/")
	if len(parts) == 0 || parts[0] == "" {
		http.NotFound(w, r)
		return
	}
	id, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	if len(parts) == 1 {
		http.NotFound(w, r)
		return
	}
	switch parts[1] {
	case "approve":
		s.handleApprove(w, r, id)
	case "deny":
		s.handleDecision(w, r, id, "denied")
	case "revoke":
		s.handleDecision(w, r, id, "revoked")
	case "extend":
		s.handleExtend(w, r, id)
	default:
		http.NotFound(w, r)
	}
}

func (s *Server) handleActive(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	ruleID := r.URL.Query().Get("rule_id")
	if ruleID == "" {
		http.Error(w, "rule_id required", http.StatusBadRequest)
		return
	}
	orgID := r.URL.Query().Get("org_id")
	args := []any{"approved", ruleID}
	where := "status = ? AND rule_id = ?"
	if orgID != "" {
		where += " AND org_id = ?"
		args = append(args, orgID)
	}
	rows, err := s.db.QueryContext(r.Context(),
		fmt.Sprintf(`SELECT id, subject_type, subject_id, requested_by, valid_until FROM exceptions WHERE %s ORDER BY valid_until IS NULL, valid_until ASC, id ASC`, where),
		args...,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	type item struct {
		ID          int64   `json:"id"`
		SubjectType string  `json:"subject_type"`
		SubjectID   string  `json:"subject_id"`
		RequestedBy *string `json:"requested_by,omitempty"`
		ValidUntil  *string `json:"valid_until,omitempty"`
	}
	resp := struct {
		Items []item `json:"items"`
	}{Items: []item{}}
	for rows.Next() {
		var it item
		var subjectType sql.NullString
		var subjectID sql.NullString
		var requestedBy sql.NullString
		var validUntil sql.NullTime
		if err := rows.Scan(&it.ID, &subjectType, &subjectID, &requestedBy, &validUntil); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if subjectType.Valid {
			it.SubjectType = subjectType.String
		}
		if subjectID.Valid {
			it.SubjectID = subjectID.String
		}
		if requestedBy.Valid {
			it.RequestedBy = &requestedBy.String
		}
		if validUntil.Valid {
			vu := validUntil.Time.UTC().Format(time.RFC3339)
			it.ValidUntil = &vu
		}
		resp.Items = append(resp.Items, it)
	}
	writeJSON(w, resp)
}

func (s *Server) handleApprove(w http.ResponseWriter, r *http.Request, id int64) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}
	actor := firstNonEmpty(r.FormValue("actor"), r.Header.Get("X-Actor"))
	if !s.canApprove(actor) {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}
	ctx := r.Context()
	exc, err := s.loadException(ctx, id)
	if errors.Is(err, sql.ErrNoRows) {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	now := s.now()
	if exc.Status == "approved" {
		// allow idempotent approve
		writeJSON(w, map[string]any{
			"id":          exc.ID,
			"status":      exc.Status,
			"valid_from":  nullableTime(exc.ValidFrom),
			"valid_until": nullableTime(exc.ValidUntil),
			"message":     "already approved",
		})
		return
	}
	if !exc.ValidFrom.Valid {
		exc.ValidFrom = sql.NullTime{Valid: true, Time: now}
	}
	capAt := exc.ValidFrom.Time.Add(7 * 24 * time.Hour)
	var newUntil *time.Time
	if raw := r.FormValue("valid_until"); raw != "" {
		t, err := time.Parse(time.RFC3339, raw)
		if err == nil {
			if t.After(capAt) {
				t = capAt
			}
			t = t.UTC()
			newUntil = &t
		}
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()
	_, err = tx.ExecContext(ctx,
		`UPDATE exceptions SET status='approved', valid_from=?, valid_until=COALESCE(?, valid_until), updated_at=? WHERE id=?`,
		exc.ValidFrom.Time, newUntil, now, id,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	note := "approved"
	if newUntil != nil {
		note = fmt.Sprintf("approved until %s", newUntil.UTC().Format(time.RFC3339))
	}
	if err := s.insertEventTx(ctx, tx, id, actor, "approve", note, now); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := tx.Commit(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	exc.Status = "approved"
	exc.ValidUntil = sql.NullTime{}
	if newUntil != nil {
		exc.ValidUntil = sql.NullTime{Valid: true, Time: newUntil.UTC()}
	}
	writeJSON(w, map[string]any{
		"id":          exc.ID,
		"status":      exc.Status,
		"valid_from":  exc.ValidFrom.Time.UTC().Format(time.RFC3339),
		"valid_until": nullableTime(exc.ValidUntil),
	})
}

func (s *Server) handleDecision(w http.ResponseWriter, r *http.Request, id int64, target string) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}
	actor := firstNonEmpty(r.FormValue("actor"), r.Header.Get("X-Actor"))
	if !s.canApprove(actor) {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}
	ctx := r.Context()
	exc, err := s.loadException(ctx, id)
	if errors.Is(err, sql.ErrNoRows) {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if exc.Status == target {
		writeJSON(w, map[string]any{
			"id":      exc.ID,
			"status":  exc.Status,
			"message": "already " + target,
		})
		return
	}
	note := target
	if raw := r.FormValue("note"); raw != "" {
		note = raw
	}
	now := s.now()
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx,
		`UPDATE exceptions SET status=?, updated_at=? WHERE id=?`, target, now, id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := s.insertEventTx(ctx, tx, id, actor, target, note, now); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := tx.Commit(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]any{"id": id, "status": target})
}

func (s *Server) handleExtend(w http.ResponseWriter, r *http.Request, id int64) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}
	actor := firstNonEmpty(r.FormValue("actor"), r.Header.Get("X-Actor"))
	if !s.canApprove(actor) {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}
	hours := 24
	if raw := r.FormValue("hours"); raw != "" {
		if n, err := strconv.Atoi(raw); err == nil {
			if n >= 1 && n <= 72 {
				hours = n
			}
		}
	}
	ctx := r.Context()
	exc, err := s.loadException(ctx, id)
	if errors.Is(err, sql.ErrNoRows) {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if exc.Status != "approved" {
		http.Error(w, "not approved", http.StatusConflict)
		return
	}
	lastExtend, err := s.lastEventTime(ctx, id, "extend")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	now := s.now()
	if lastExtend.Valid && now.Sub(lastExtend.Time) < 30*time.Minute {
		http.Error(w, "extend backoff (try later)", http.StatusTooManyRequests)
		return
	}
	if !exc.ValidFrom.Valid {
		exc.ValidFrom = sql.NullTime{Valid: true, Time: now}
	}
	capAt := exc.ValidFrom.Time.Add(7 * 24 * time.Hour)
	base := now
	if exc.ValidUntil.Valid && exc.ValidUntil.Time.After(base) {
		base = exc.ValidUntil.Time
	}
	proposed := base.Add(time.Duration(hours) * time.Hour)
	capped := false
	if proposed.After(capAt) {
		proposed = capAt
		capped = true
	}
	if !proposed.After(base) {
		writeJSON(w, map[string]any{
			"id":          exc.ID,
			"status":      exc.Status,
			"valid_until": base.UTC().Format(time.RFC3339),
			"capped":      true,
			"message":     "hit 7-day cap",
		})
		return
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx,
		`UPDATE exceptions SET valid_until=?, updated_at=? WHERE id=?`, proposed, now, id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	prev := "(none)"
	if exc.ValidUntil.Valid {
		prev = exc.ValidUntil.Time.UTC().Format(time.RFC3339)
	}
	note := fmt.Sprintf("+%dh (prev=%s)", hours, prev)
	if capped {
		note += " capped at 7d"
	}
	if err := s.insertEventTx(ctx, tx, id, actor, "extend", note, now); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := tx.Commit(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]any{
		"id":          exc.ID,
		"status":      exc.Status,
		"valid_until": proposed.UTC().Format(time.RFC3339),
		"capped":      capped,
	})
}

func (s *Server) StartScheduler(ctx context.Context) {
	ticker := time.NewTicker(s.tickerInterval)
	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if err := s.runReminders(ctx); err != nil {
					log.Printf("reminders: %v", err)
				}
				if _, err := s.expireOld(ctx); err != nil {
					log.Printf("expire: %v", err)
				}
			}
		}
	}()
}

func (s *Server) runReminders(ctx context.Context) error {
	// remind once when within [now+lead-leadWindow, now+lead]
	now := s.now()
	upper := now.Add(s.reminderLead)
	lower := upper.Add(-s.reminderWindow)
	rows, err := s.db.QueryContext(ctx, `SELECT e.id, e.valid_until FROM exceptions e
        WHERE e.status='approved' AND e.valid_until IS NOT NULL AND e.valid_until BETWEEN ? AND ?
        AND NOT EXISTS (SELECT 1 FROM exception_events ev WHERE ev.exception_id=e.id AND ev.action='reminder' AND ev.at >= ?)
        ORDER BY e.valid_until ASC`, lower, upper, lower)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var id int64
		var until time.Time
		if err := rows.Scan(&id, &until); err != nil {
			return err
		}
		if err := s.insertEvent(ctx, id, "system", "reminder", fmt.Sprintf("expiry %s", until.UTC().Format(time.RFC3339)), s.now()); err != nil {
			return err
		}
	}
	return rows.Err()
}

func (s *Server) expireOld(ctx context.Context) (int64, error) {
	now := s.now()
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()
	res, err := tx.ExecContext(ctx, `UPDATE exceptions SET status='expired', updated_at=? WHERE status='approved' AND valid_until IS NOT NULL AND valid_until <= ?`, now, now)
	if err != nil {
		return 0, err
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return 0, err
	}
	if affected > 0 {
		rows, err := tx.QueryContext(ctx, `SELECT id FROM exceptions WHERE status='expired' AND updated_at=?`, now)
		if err != nil {
			return 0, err
		}
		for rows.Next() {
			var id int64
			if err := rows.Scan(&id); err != nil {
				rows.Close()
				return 0, err
			}
			if err := s.insertEventTx(ctx, tx, id, "system", "expired", "auto-expired", now); err != nil {
				rows.Close()
				return 0, err
			}
		}
		rows.Close()
	}
	if err := tx.Commit(); err != nil {
		return 0, err
	}
	return affected, nil
}

func (s *Server) loadException(ctx context.Context, id int64) (*Exception, error) {
	row := s.db.QueryRowContext(ctx, `SELECT id, status, rule_id, org_id, subject_type, subject_id, requested_by, valid_from, valid_until FROM exceptions WHERE id=?`, id)
	var exc Exception
	exc.ID = id
	err := row.Scan(&exc.ID, &exc.Status, &exc.RuleID, &exc.OrgID, &exc.SubjectType, &exc.SubjectID, &exc.RequestedBy, &exc.ValidFrom, &exc.ValidUntil)
	if err != nil {
		return nil, err
	}
	return &exc, nil
}

func (s *Server) insertEvent(ctx context.Context, id int64, actor, action, note string, at time.Time) error {
	_, err := s.db.ExecContext(ctx, `INSERT INTO exception_events(exception_id, actor, action, note, at) VALUES(?, ?, ?, ?, ?)`, id, actor, action, note, at.UTC())
	return err
}

func (s *Server) insertEventTx(ctx context.Context, tx *sql.Tx, id int64, actor, action, note string, at time.Time) error {
	_, err := tx.ExecContext(ctx, `INSERT INTO exception_events(exception_id, actor, action, note, at) VALUES(?, ?, ?, ?, ?)`, id, actor, action, note, at.UTC())
	return err
}

func (s *Server) lastEventTime(ctx context.Context, id int64, action string) (sql.NullTime, error) {
	var raw sql.NullString
	if err := s.db.QueryRowContext(ctx, `SELECT MAX(at) FROM exception_events WHERE exception_id=? AND action=?`, id, action).Scan(&raw); err != nil {
		return sql.NullTime{}, err
	}
	if !raw.Valid || strings.TrimSpace(raw.String) == "" {
		return sql.NullTime{}, nil
	}
	layouts := []string{time.RFC3339Nano, time.RFC3339, "2006-01-02 15:04:05", "2006-01-02 15:04:05-07:00"}
	for _, layout := range layouts {
		if ts, err := time.Parse(layout, raw.String); err == nil {
			return sql.NullTime{Valid: true, Time: ts.UTC()}, nil
		}
	}
	return sql.NullTime{}, fmt.Errorf("unknown time format: %s", raw.String)
}

func (s *Server) canApprove(actor string) bool {
	return actor != ""
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}

func writeJSON(w http.ResponseWriter, payload any) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func nullableTime(v sql.NullTime) any {
	if v.Valid {
		return v.Time.UTC().Format(time.RFC3339)
	}
	return nil
}

func InitSchema(ctx context.Context, db *sql.DB) error {
	_, err := db.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS exceptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_id TEXT NOT NULL,
        org_id TEXT,
        subject_type TEXT,
        subject_id TEXT,
        requested_by TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        valid_from TIMESTAMP,
        valid_until TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`)
	if err != nil {
		return err
	}
	_, err = db.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS exception_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exception_id INTEGER NOT NULL,
        actor TEXT,
        action TEXT NOT NULL,
        note TEXT,
        at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(exception_id) REFERENCES exceptions(id)
    );`)
	if err != nil {
		return err
	}
	_, err = db.ExecContext(ctx, `CREATE INDEX IF NOT EXISTS ix_exc_approved ON exceptions(status, valid_from, valid_until);`)
	if err != nil {
		return err
	}
	_, err = db.ExecContext(ctx, `CREATE INDEX IF NOT EXISTS ix_excevts_exc_time ON exception_events(exception_id, action, at);`)
	return err
}

// Exception is a lightweight projection of the exceptions row.
type Exception struct {
	ID          int64
	Status      string
	RuleID      string
	OrgID       sql.NullString
	SubjectType string
	SubjectID   string
	RequestedBy sql.NullString
	ValidFrom   sql.NullTime
	ValidUntil  sql.NullTime
}
