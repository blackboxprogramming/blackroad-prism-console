package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	ch "github.com/ClickHouse/clickhouse-go/v2"
)

type Point struct {
	T int64   `json:"t"`
	V float64 `json:"v"`
}

type Series struct {
	Points []Point `json:"points"`
}

func main() {
	dsn := os.Getenv("CH_DSN")
	if dsn == "" {
		log.Fatal("CH_DSN is required")
	}

	opts, err := ch.ParseDSN(dsn)
	if err != nil {
		log.Fatalf("parse dsn: %v", err)
	}

	conn, err := ch.Open(opts)
	if err != nil {
		log.Fatalf("connect clickhouse: %v", err)
	}
	defer func() {
		if err := conn.Close(); err != nil {
			log.Printf("close clickhouse: %v", err)
		}
	}()

	http.HandleFunc("/metrics/consent_abandonment_rate", func(w http.ResponseWriter, r *http.Request) {
		s, err := queryConsentAbandonment(r.Context(), conn)
		if err != nil {
			status := http.StatusBadGateway
			if errors.Is(err, errNoData) {
				status = http.StatusOK
			}
			http.Error(w, err.Error(), status)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(s); err != nil {
			log.Printf("encode response: %v", err)
		}
	})

	log.Println("metrics proxy listening on :9099")
	if err := http.ListenAndServe(":9099", nil); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

var errNoData = errors.New("no data")

type ratioRow struct {
	TS time.Time
	R  *float64
}

func queryConsentAbandonment(ctx context.Context, conn ch.Conn) (Series, error) {
	rows, err := conn.Query(ctx, `
WITH w AS (
  SELECT
    toStartOfHour(ts) AS bucket,
    countIf(outcome='deny' AND deny_reason='consent_required') AS started,
    countIf(outcome='allow') AS allows
  FROM audit_events
  WHERE ts >= now() - INTERVAL 7 DAY
  GROUP BY bucket
)
SELECT bucket, if(started=0, NULL, (started - allows)/started) AS ratio
FROM w
ORDER BY bucket
`)
	if err != nil {
		return Series{}, err
	}
	defer rows.Close()

	series := Series{}
	for rows.Next() {
		var rr ratioRow
		if err := rows.Scan(&rr.TS, &rr.R); err != nil {
			return Series{}, err
		}
		val := 0.0
		if rr.R != nil {
			val = clamp01(*rr.R)
		}
		series.Points = append(series.Points, Point{T: rr.TS.UnixMilli(), V: val})
	}
	if err := rows.Err(); err != nil {
		return Series{}, err
	}
	if len(series.Points) == 0 {
		return series, errNoData
	}
	return series, nil
}

func clamp01(x float64) float64 {
	if x < 0 {
		return 0
	}
	if x > 1 {
		return 1
	}
	return x
}
