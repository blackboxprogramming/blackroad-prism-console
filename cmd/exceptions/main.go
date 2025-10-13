package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/glebarez/sqlite"

	"github.com/blackroad/prism-console/internal/exceptions"
)

func main() {
	dsn := os.Getenv("EXCEPTIONS_DB")
	if dsn == "" {
		dsn = "exceptions.db"
	}
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	db.SetMaxOpenConns(1)
	ctx := context.Background()
	if err := exceptions.InitSchema(ctx, db); err != nil {
		log.Fatalf("init schema: %v", err)
	}

	srv := exceptions.NewServer(db)
	mux := http.NewServeMux()
	srv.Register(mux)

	rootCtx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()
	srv.StartScheduler(rootCtx)

	addr := os.Getenv("EXCEPTIONS_ADDR")
	if addr == "" {
		addr = ":8081"
	}

	server := &http.Server{
		Addr:         addr,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		<-rootCtx.Done()
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = server.Shutdown(ctx)
	}()

	log.Printf("exceptions service listening on %s", addr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("listen: %v", err)
	}
}
