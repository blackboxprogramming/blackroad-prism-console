

use axum::{extract::Query, http::StatusCode, response::IntoResponse, routing::{get, post}, Json, Router};
use clap::{Parser, Subcommand};
use serde::Deserialize;
use std::net::SocketAddr;
use tower_http::{cors::{Any, CorsLayer}, trace::TraceLayer};
use symbol_gateway::*;

mod symbol_gateway {
    pub use symbol_gateway::*;
}
use symbol_gateway::{resolve_one, search};
use codex::{EMOJI, ROOT, SYM};

#[derive(Parser)]
#[command(name = "symbol-gateway", version, about = "Unicode-by-name gateway (Typst Codex powered)")]
struct Cli {
    /// Run as an HTTP server or use CLI tools
    #[command(subcommand)]
    cmd: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Start HTTP server
    Serve {
        #[arg(long, default_value = "127.0.0.1:8087")]
        addr: String,
        #[arg(long, default_value_t = true)]
        cors_any: bool,
    },
    /// Resolve a single name (e.g., sym.arrow.r)
    Resolve { name: String },
    /// Search keys (in sym/emoji/root)
    Search { #[arg(long, default_value = "sym")] module: String, query: String },
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().with_target(false).compact().init();

    let cli = Cli::parse();
    match cli.cmd {
        Commands::Serve { addr, cors_any } => {
            let app = router().layer(TraceLayer::new_for_http()).layer(
                if cors_any {
                    CorsLayer::new()
                        .allow_origin(Any)
                        .allow_methods(Any)
                        .allow_headers(Any)
                } else {
                    CorsLayer::permissive()
                },
            );
            let addr: SocketAddr = addr.parse().expect("bad addr");
            tracing::info!("symbol-gateway listening on http://{addr}");
            axum::Server::bind(&addr).serve(app.into_make_service()).await.unwrap();
        }
        Commands::Resolve { name } => {
            if let Some(r) = resolve_one(&name) {
                println!("{}\t{}\t{}", r.ch, r.input, r.variant_key.unwrap_or_default());
                println!("codepoint: U+{:04X}", r.ch as u32);
            } else {
                eprintln!("not found: {name}");
                std::process::exit(2);
            }
        }
        Commands::Search { module, query } => {
            let m = match module.as_str() { "sym" => SYM, "emoji" => EMOJI, "root" => ROOT, _ => SYM };
            for (k, c) in search(m, &query) {
                println!("{c}\t{k}");
            }
        }
    }
}

fn router() -> Router {
    Router::new()
        .route("/healthz", get(|| async { "ok" }))
        .route("/v1/resolve", get(http_resolve))
        .route("/v1/batch", post(http_batch))
        .route("/v1/search", get(http_search))
}

#[derive(Deserialize)]
struct ResolveParams { name: String }

async fn http_resolve(Query(q): Query<ResolveParams>) -> impl IntoResponse {
    match resolve_one(&q.name) {
        Some(r) => (StatusCode::OK, Json(symbol_gateway::JsonResolved::from(r))),
        None => (StatusCode::NOT_FOUND, Json(serde_json::json!({
            "error": "not-found", "name": q.name
        }))),
    }
}

#[derive(Deserialize)]
struct BatchReq { names: Vec<String> }

async fn http_batch(Json(b): Json<BatchReq>) -> impl IntoResponse {
    let out: Vec<_> = b.names.iter()
        .filter_map(|n| symbol_gateway::resolve_one(n).map(symbol_gateway::JsonResolved::from))
        .collect();
    Json(out)
}

#[derive(Deserialize)]
struct SearchParams { query: String, module: Option<String> }

async fn http_search(Query(q): Query<SearchParams>) -> impl IntoResponse {
    let m = match q.module.as_deref() { Some("emoji") => EMOJI, Some("root") => ROOT, _ => SYM };
    let rows = symbol_gateway::search(m, &q.query);
    Json(serde_json::json!({
        "query": q.query,
        "module": q.module.unwrap_or_else(|| "sym".into()),
        "results": rows.into_iter().map(|(k,c)| {
            serde_json::json!({"name": format!("sym.{k}"), "char": c.to_string()})
        }).collect::<Vec<_>>()
    }))
}
