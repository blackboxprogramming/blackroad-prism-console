package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"time"
)

type Point struct {
	T int64   `json:"t"`
	V float64 `json:"v"`
}

type Series struct {
	Points []Point `json:"points"`
}

type promValue struct {
	Values [][]any `json:"values"`
}

type promResponse struct {
	Data struct {
		Result []promValue `json:"result"`
	} `json:"data"`
}

var httpClient = &http.Client{Timeout: 10 * time.Second}

func main() {
	base := os.Getenv("PROM_URL")
	http.HandleFunc("/metrics/consent_abandonment_rate", func(w http.ResponseWriter, r *http.Request) {
		if base == "" {
			http.Error(w, "PROM_URL not configured", http.StatusInternalServerError)
			return
		}
		window := "7d"
		step := "1h"
		query := `(
            increase(consent_escalations_started_total[` + window + `])
            - increase(consent_escalations_resolved_total[` + window + `])
        ) / clamp_min(increase(consent_escalations_started_total[` + window + `]),1)`
		params := url.Values{
			"query": {query},
			"start": {time.Now().Add(-7 * 24 * time.Hour).Format(time.RFC3339)},
			"end":   {time.Now().Format(time.RFC3339)},
			"step":  {step},
		}
		upstream, err := url.Parse(base)
		if err != nil {
			http.Error(w, fmt.Sprintf("invalid PROM_URL: %v", err), http.StatusInternalServerError)
			return
		}
		upstream.RawQuery = params.Encode()

		resp, err := httpClient.Get(upstream.String())
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()
		if resp.StatusCode >= 400 {
			body, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
			http.Error(w, fmt.Sprintf("upstream error %d: %s", resp.StatusCode, string(body)), http.StatusBadGateway)
			return
		}
		var out promResponse
		if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
			http.Error(w, err.Error(), http.StatusBadGateway)
			return
		}
		series := buildSeries(out)
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(series); err != nil {
			log.Printf("encode response: %v", err)
		}
	})

	log.Println("metrics proxy listening on :9099")
	if err := http.ListenAndServe(":9099", nil); err != nil {
		log.Fatal(err)
	}
}

func buildSeries(resp promResponse) Series {
	var series Series
	if len(resp.Data.Result) == 0 {
		return series
	}
	for _, entry := range resp.Data.Result[0].Values {
		if len(entry) < 2 {
			continue
		}
		tsFloat, ok := entry[0].(float64)
		if !ok {
			continue
		}
		rawValue, ok := entry[1].(string)
		if !ok {
			continue
		}
		value, err := strconv.ParseFloat(rawValue, 64)
		if err != nil {
			continue
		}
		series.Points = append(series.Points, Point{T: int64(tsFloat * 1000), V: clamp01(value)})
	}
	return series
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
