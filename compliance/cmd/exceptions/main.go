package main

import (
	"database/sql"
	"embed"
	"encoding/json"
	"html/template"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	_ "modernc.org/sqlite"
)

//go:embed exceptions.sql
var schemaFS embed.FS

type Exception struct {
	ID          int64      `json:"id"`
	RuleID      string     `json:"rule_id"`
	OrgID       string     `json:"org_id"`
	SubjectType string     `json:"subject_type"`
	SubjectID   string     `json:"subject_id"`
	RequestedBy string     `json:"requested_by"`
	Reason      string     `json:"reason"`
	Status      string     `json:"status"`
	ValidFrom   *time.Time `json:"valid_from,omitempty"`
	ValidUntil  *time.Time `json:"valid_until,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

var (
	db  *sql.DB
	tpl = template.Must(template.New("form").Parse(`
<!doctype html><meta charset="utf-8"/>
<title>Request Exception</title>
<style>body{font-family:system-ui;margin:2rem}label{display:block;margin:.5rem 0}.row{margin:.5rem 0}</style>
<h2>Request Exception</h2>
<form method="POST" action="/exceptions">
  <div class="row"><label>Rule ID <input name="rule_id" required value="{{.RuleID}}"></label></div>
  <div class="row"><label>Org ID <input name="org_id" required value="{{.OrgID}}"></label></div>
  <div class="row"><label>Subject Type
    <select name="subject_type">
      <option value="repo" {{if eq .SubjectType "repo"}}selected{{end}}>repo</option>
      <option value="project" {{if eq .SubjectType "project"}}selected{{end}}>project</option>
      <option value="user" {{if eq .SubjectType "user"}}selected{{end}}>user</option>
      <option value="group" {{if eq .SubjectType "group"}}selected{{end}}>group</option>
    </select>
  </label></div>
  <div class="row"><label>Subject ID <input name="subject_id" required value="{{.SubjectID}}"></label></div>
  <div class="row"><label>Requested By <input name="requested_by" required value="{{.RequestedBy}}"></label></div>
  <div class="row"><label>Reason <textarea name="reason" required rows="4" cols="60">{{.Reason}}</textarea></label></div>
  <div class="row"><label>Valid Until (optional, RFC3339) <input name="valid_until" placeholder="2025-12-31T23:59:59Z"></label></div>
  <button type="submit">Submit</button>
</form>

<hr/>
<h3>Open Exceptions</h3>
<ul>
{{range .Open}}
  <li>#{{.ID}} — <b>{{.RuleID}}</b> on {{.SubjectType}}:{{.SubjectID}} —
      <i>{{.Status}}</i> until {{if .ValidUntil}}{{.ValidUntil}}{{else}}(none){{end}}
    <form method="POST" action="/exceptions/{{.ID}}/approve" style="display:inline">
      <input name="actor" placeholder="approver" required>
      <input name="valid_until" placeholder="2025-12-31T23:59:59Z">
      <button>Approve</button>
    </form>
    <form method="POST" action="/exceptions/{{.ID}}/deny" style="display:inline">
      <input name="actor" placeholder="approver" required>
      <button> Deny</button>
    </form>
  </li>
{{else}}
  <li>(none)</li>
{{end}}
</ul>
`))
)

func main() {
	dsn := getenv("SQLITE_DSN", "file:exceptions.db?cache=shared&mode=rwc")
	var err error
	db, err = sql.Open("sqlite", dsn)
	must(err)
	must(applySchema())

	mux := http.NewServeMux()

	mux.HandleFunc("/exceptions/new", handleNewForm)
	mux.HandleFunc("/exceptions", handleCreateOrList)
	mux.HandleFunc("/exceptions/", handleMutations)
	mux.HandleFunc("/admin/expire", handleExpire)

	addr := getenv("ADDR", ":8081")
	log.Println("exceptions service on", addr)
	log.Fatal(http.ListenAndServe(addr, withJSON(wrapCORS(mux))))
}

func handleExpire(w http.ResponseWriter, r *http.Request) {
	n, err := expireOld()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	_, _ = w.Write([]byte("expired: " + strconv.Itoa(n)))
}

func applySchema() error {
	sqlBytes, err := schemaFS.ReadFile("exceptions.sql")
	if err != nil {
		return err
	}
	_, err = db.Exec(string(sqlBytes))
	return err
}

func handleNewForm(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "GET only", http.StatusMethodNotAllowed)
		return
	}
	data := struct {
		RuleID, OrgID, SubjectType, SubjectID, RequestedBy, Reason string
		Open                                                       []Exception
	}{}
	data.RuleID = r.URL.Query().Get("rule_id")
	data.OrgID = r.URL.Query().Get("org_id")
	data.SubjectType = or(r.URL.Query().Get("subject_type"), "repo")
	data.SubjectID = r.URL.Query().Get("subject_id")
	data.RequestedBy = r.URL.Query().Get("user")
	data.Reason = "Context: …"
	open, _ := listByStatus("approved", "pending")
	data.Open = append(open["approved"], open["pending"]...)
	_ = tpl.Execute(w, data)
}

func handleCreateOrList(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		status := r.URL.Query().Get("status")
		if status == "" {
			status = "pending"
		}
		rows, err := db.Query(`SELECT id,rule_id,org_id,subject_type,subject_id,requested_by,reason,status,valid_from,valid_until,created_at,updated_at
            FROM exceptions WHERE status=? ORDER BY created_at DESC`, status)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var out []Exception
		for rows.Next() {
			var e Exception
			var vf, vu sql.NullTime
			must(rows.Scan(&e.ID, &e.RuleID, &e.OrgID, &e.SubjectType, &e.SubjectID, &e.RequestedBy, &e.Reason, &e.Status, &vf, &vu, &e.CreatedAt, &e.UpdatedAt))
			if vf.Valid {
				e.ValidFrom = &vf.Time
			}
			if vu.Valid {
				e.ValidUntil = &vu.Time
			}
			out = append(out, e)
		}
		writeJSON(w, out)
	case http.MethodPost:
		must(r.ParseForm())
		ruleID := r.FormValue("rule_id")
		orgID := r.FormValue("org_id")
		subjectType := r.FormValue("subject_type")
		subjectID := r.FormValue("subject_id")
		requestedBy := r.FormValue("requested_by")
		reason := r.FormValue("reason")

		var validUntil *time.Time
		if vu := r.FormValue("valid_until"); vu != "" {
			if t, err := time.Parse(time.RFC3339, vu); err == nil {
				validUntil = &t
			}
		}

		res, err := db.Exec(`INSERT INTO exceptions(rule_id,org_id,subject_type,subject_id,requested_by,reason,status,valid_until)
            VALUES(?,?,?,?,?,?, 'pending', ?)`, ruleID, orgID, subjectType, subjectID, requestedBy, reason, validUntil)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		id, _ := res.LastInsertId()
		_, _ = db.Exec(`INSERT INTO exception_events(exception_id, actor, action, note) VALUES(?,?, 'request', ?)`, id, requestedBy, reason)
		writeJSON(w, map[string]any{"id": id, "status": "pending"})
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func handleMutations(w http.ResponseWriter, r *http.Request) {
	parts := split(r.URL.Path, '/')
	if len(parts) < 4 {
		http.NotFound(w, r)
		return
	}
	id, err := strconv.ParseInt(parts[2], 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	action := parts[3]
	must(r.ParseForm())
	actor := or(r.FormValue("actor"), r.Header.Get("X-Actor"))

	switch r.Method + " " + action {
	case "POST approve":
		var validUntil *time.Time
		if vu := r.FormValue("valid_until"); vu != "" {
			if t, err := time.Parse(time.RFC3339, vu); err == nil {
				validUntil = &t
			}
		}
		if _, err := db.Exec(`UPDATE exceptions SET status='approved', valid_from=CURRENT_TIMESTAMP, valid_until=COALESCE(?,valid_until), updated_at=CURRENT_TIMESTAMP WHERE id=?`,
			validUntil, id); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		_, _ = db.Exec(`INSERT INTO exception_events(exception_id, actor, action) VALUES(?,?,'approve')`, id, actor)
		writeJSON(w, map[string]any{"id": id, "status": "approved"})
	case "POST deny":
		if _, err := db.Exec(`UPDATE exceptions SET status='denied', updated_at=CURRENT_TIMESTAMP WHERE id=?`, id); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		_, _ = db.Exec(`INSERT INTO exception_events(exception_id, actor, action) VALUES(?,?,'deny')`, id, actor)
		writeJSON(w, map[string]any{"id": id, "status": "denied"})
	case "POST revoke":
		if _, err := db.Exec(`UPDATE exceptions SET status='revoked', updated_at=CURRENT_TIMESTAMP WHERE id=?`, id); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		_, _ = db.Exec(`INSERT INTO exception_events(exception_id, actor, action) VALUES(?,?,'revoke')`, id, actor)
		writeJSON(w, map[string]any{"id": id, "status": "revoked"})
	default:
		http.Error(w, "not found", http.StatusNotFound)
	}
}

func expireOld() (int, error) {
	res, err := db.Exec(`UPDATE exceptions SET status='expired', updated_at=CURRENT_TIMESTAMP
        WHERE status='approved' AND valid_until IS NOT NULL AND valid_until < CURRENT_TIMESTAMP`)
	if err != nil {
		return 0, err
	}
	n, _ := res.RowsAffected()
	return int(n), nil
}

func listByStatus(status ...string) (map[string][]Exception, error) {
	out := make(map[string][]Exception, len(status))
	for _, s := range status {
		rows, err := db.Query(`SELECT id,rule_id,org_id,subject_type,subject_id,requested_by,reason,status,valid_from,valid_until,created_at,updated_at
            FROM exceptions WHERE status=? ORDER BY created_at DESC`, s)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		var list []Exception
		for rows.Next() {
			var e Exception
			var vf, vu sql.NullTime
			must(rows.Scan(&e.ID, &e.RuleID, &e.OrgID, &e.SubjectType, &e.SubjectID, &e.RequestedBy, &e.Reason, &e.Status, &vf, &vu, &e.CreatedAt, &e.UpdatedAt))
			if vf.Valid {
				e.ValidFrom = &vf.Time
			}
			if vu.Valid {
				e.ValidUntil = &vu.Time
			}
			list = append(list, e)
		}
		out[s] = list
	}
	return out, nil
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}

func withJSON(h http.Handler) http.Handler { return h }

func wrapCORS(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		if r.Method == http.MethodOptions {
			return
		}
		h.ServeHTTP(w, r)
	})
}

func must(err error) {
	if err != nil {
		log.Fatal(err)
	}
}

func or(a, b string) string {
	if a != "" {
		return a
	}
	return b
}

func getenv(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

func split(p string, sep byte) []string {
	var out []string
	b := []byte(p)
	last := 0
	for i := 0; i < len(b); i++ {
		if b[i] == sep {
			if i > last {
				out = append(out, string(b[last:i]))
			}
			last = i + 1
		}
	}
	if last < len(b) {
		out = append(out, string(b[last:]))
	}
	return out
}
