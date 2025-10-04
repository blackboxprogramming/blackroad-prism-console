package main

import (
	"context"
	"database/sql"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/blackroad/prism-console/compliance/exceptions"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func main() {
	var (
		dsn            = flag.String("dsn", getenv("DATABASE_URL", ""), "database connection string")
		driver         = flag.String("driver", getenv("DB_DRIVER", ""), "database/sql driver (postgres|sqlite)")
		slackToken     = flag.String("slack-token", os.Getenv("SLACK_BOT_TOKEN"), "Slack bot token")
		defaultChannel = flag.String("default-channel", getenv("SECOPS_CHANNEL", "#secops"), "fallback Slack channel")
		listenAddr     = flag.String("listen", getenv("EXCEPTIONS_LISTEN", ""), "HTTP listen address (optional)")
		interval       = flag.Duration("interval", getDurationEnv("EXCEPTIONS_REMINDER_INTERVAL", 0), "reminder sweep interval")
		window         = flag.Duration("window", getDurationEnv("EXCEPTIONS_REMINDER_WINDOW", 2*time.Hour), "reminder window duration")
	)
	flag.Parse()

	if *dsn == "" {
		log.Fatal("exceptions: dsn is required (set --dsn or DATABASE_URL)")
	}
	if *driver == "" {
		*driver = inferDriver(*dsn)
	}

	db, err := sql.Open(*driver, *dsn)
	if err != nil {
		log.Fatalf("exceptions: open db: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("exceptions: ping db: %v", err)
	}

	placeholder := func(n int) string { return "?" }
	drv := strings.ToLower(*driver)
	if strings.Contains(drv, "pg") || strings.Contains(drv, "post") {
		placeholder = func(n int) string { return fmt.Sprintf("$%d", n) }
	}

	slackPoster := exceptions.SlackAPIPoster{Token: *slackToken}
	opts := []exceptions.Option{
		exceptions.WithDefaultChannel(*defaultChannel),
		exceptions.WithPlaceholder(placeholder),
		exceptions.WithLogger(log.Default()),
	}
	svc, err := exceptions.NewService(db, slackPoster, opts...)
	if err != nil {
		log.Fatalf("exceptions: init service: %v", err)
	}

	if *listenAddr != "" {
		mux := http.NewServeMux()
		mux.HandleFunc("/exceptions/active", svc.HandleActive())
		go func() {
			log.Printf("exceptions: http listening on %s", *listenAddr)
			if err := http.ListenAndServe(*listenAddr, mux); err != nil {
				log.Fatalf("exceptions: http server: %v", err)
			}
		}()
	}

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	runOnce := func() {
		sweepCtx, sweepCancel := context.WithTimeout(ctx, 30*time.Second)
		defer sweepCancel()
		if _, err := svc.RunReminderSweep(sweepCtx, *window); err != nil {
			log.Printf("exceptions: reminder sweep error: %v", err)
		}
	}

	runOnce()
	if *interval <= 0 {
		<-ctx.Done()
		return
	}

	ticker := time.NewTicker(*interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			runOnce()
		}
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getDurationEnv(key string, fallback time.Duration) time.Duration {
	if v := os.Getenv(key); v != "" {
		if d, err := time.ParseDuration(v); err == nil {
			return d
		}
	}
	return fallback
}

func inferDriver(dsn string) string {
	if strings.HasPrefix(dsn, "postgres://") || strings.HasPrefix(dsn, "postgresql://") {
		return "pgx"
	}
	return "pgx"
}
