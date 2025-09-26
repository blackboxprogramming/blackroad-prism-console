use clap::{Parser, Subcommand};
use prism_core::{default_socket, Command};
use prettytable::{row, Table};
use std::path::PathBuf;
use tokio::net::UnixStream;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[derive(Parser)]
#[command(author, version, about)]
struct Cli {
    /// Output raw JSON
    #[arg(long)]
    json: bool,
    /// Socket path
    #[arg(long)]
    socket: Option<PathBuf>,
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    Status,
    Restart { agent: String },
    Snapshot { agent: String },
    Rollback { agent: String },
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();
    let socket = cli.socket.unwrap_or_else(default_socket);
    let cmd = match &cli.command {
        Commands::Status => Command { cmd: "status".into(), agent: None },
        Commands::Restart { agent } => Command { cmd: "restart".into(), agent: Some(agent.clone()) },
        Commands::Snapshot { agent } => Command { cmd: "snapshot".into(), agent: Some(agent.clone()) },
        Commands::Rollback { agent } => Command { cmd: "rollback".into(), agent: Some(agent.clone()) },
    };
    let mut stream = UnixStream::connect(socket).await?;
    let req = serde_json::to_vec(&cmd)?;
    stream.write_all(&req).await?;
    stream.shutdown().await?;
    let mut buf = Vec::new();
    stream.read_to_end(&mut buf).await?;
    let resp: prism_core::Response = serde_json::from_slice(&buf)?;
    if cli.json {
        println!("{}", serde_json::to_string_pretty(&resp.data)?);
    } else if let Some(arr) = resp.data.as_array() {
        let mut table = Table::new();
        table.add_row(row!["NAME", "VERSION", "STATUS"]);
        for agent in arr {
            let name = agent.get("name").and_then(|v| v.as_str()).unwrap_or("");
            let version = agent.get("version").and_then(|v| v.as_str()).unwrap_or("");
            let status = agent.get("status").and_then(|v| v.as_str()).unwrap_or("");
            table.add_row(row![name, version, status]);
        }
        table.printstd();
    } else {
        println!("{}", resp.data);
    }
    Ok(())
}
