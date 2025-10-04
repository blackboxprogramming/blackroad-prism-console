package harness

import (
	"database/sql"
	"time"
)

// ExceptionLookup provides helpers for querying exception records for a rule/subject pair.
type ExceptionLookup struct{ DB *sql.DB }

// IsExcepted reports whether the supplied rule and subject are currently covered by an approved exception.
// It returns the matching exception identifier when present.
func (el ExceptionLookup) IsExcepted(ruleID, subjectType, subjectID, orgID string, now time.Time) (bool, int64, error) {
	if el.DB == nil {
		return false, 0, sql.ErrConnDone
	}

	var id int64
	err := el.DB.QueryRow(`
SELECT id
FROM exceptions
WHERE rule_id=? AND org_id=? AND subject_type=? AND subject_id=?
  AND status='approved'
  AND (valid_from IS NULL OR valid_from <= ?)
  AND (valid_until IS NULL OR valid_until >= ?)
LIMIT 1
`, ruleID, orgID, subjectType, subjectID, now, now).Scan(&id)
	if err == sql.ErrNoRows {
		return false, 0, nil
	}
	if err != nil {
		return false, 0, err
	}
	return true, id, nil
}
