package exceptions

import (
	"context"
	"database/sql"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	_ "github.com/glebarez/sqlite"
)

func setupTestDB(t *testing.T) *sql.DB {
	t.Helper()
	db, err := sql.Open("sqlite", "file::memory:?cache=shared")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := InitSchema(context.Background(), db); err != nil {
		t.Fatalf("init schema: %v", err)
	}
	return db
}

func mustExec(t *testing.T, db *sql.DB, query string, args ...any) {
	t.Helper()
	if _, err := db.Exec(query, args...); err != nil {
		t.Fatalf("exec %s: %v", query, err)
	}
}

func TestExtendBackoffAndCap(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	now := time.Date(2025, 1, 1, 10, 0, 0, 0, time.UTC)
	mustExec(t, db, `INSERT INTO exceptions(id, rule_id, subject_type, subject_id, requested_by, status, valid_from, valid_until, created_at, updated_at)
        VALUES(1, 'r1', 'user', 'alice', 'alice', 'approved', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, now.Add(-2*time.Hour), now.Add(24*time.Hour))

	srv := NewServer(db)
	srv.SetClock(func() time.Time { return now })
	mux := http.NewServeMux()
	srv.Register(mux)

	form := url.Values{"actor": {"alice"}, "hours": {"24"}}
	req := httptest.NewRequest(http.MethodPost, "/exceptions/1/extend", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	res := httptest.NewRecorder()
	mux.ServeHTTP(res, req)
	if res.Code != http.StatusOK {
		t.Fatalf("first extend status=%d body=%s", res.Code, res.Body.String())
	}

	// Immediate retry should hit backoff
	req2 := httptest.NewRequest(http.MethodPost, "/exceptions/1/extend", strings.NewReader(form.Encode()))
	req2.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	res2 := httptest.NewRecorder()
	mux.ServeHTTP(res2, req2)
	if res2.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429, got %d body=%s", res2.Code, res2.Body.String())
	}

	// Fast forward near cap: 7-day cap from valid_from
	srv.SetClock(func() time.Time { return now.Add(6*24*time.Hour + 23*time.Hour) })
	lt, err := srv.lastEventTime(context.Background(), 1, "extend")
	if err != nil {
		t.Fatalf("lastEventTime: %v", err)
	}
	if !lt.Valid {
		t.Fatalf("expected last extend to be valid")
	}
	if d := srv.now().Sub(lt.Time); d < 30*time.Minute {
		t.Fatalf("unexpected backoff window: %v (now=%s last=%s)", d, srv.now(), lt.Time)
	}
	req3 := httptest.NewRequest(http.MethodPost, "/exceptions/1/extend", strings.NewReader(form.Encode()))
	req3.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	res3 := httptest.NewRecorder()
	mux.ServeHTTP(res3, req3)
	if res3.Code != http.StatusOK {
		t.Fatalf("expected ok, got %d body=%s", res3.Code, res3.Body.String())
	}
	if !strings.Contains(res3.Body.String(), "\"capped\":true") {
		t.Fatalf("expected capped response: %s", res3.Body.String())
	}
}
