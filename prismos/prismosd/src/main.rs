use clap::Parser;
use prism_core::{default_agent_dir, default_socket, run_server, AgentManager};
use std::path::PathBuf;

#[derive(Parser, Debug)]
struct Args {
    /// Directory of agent definitions
    #[arg(long)]
    agents: Option<PathBuf>,
    /// Socket path
    #[arg(long)]
    socket: Option<PathBuf>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();
    let dir = args.agents.unwrap_or_else(default_agent_dir);
    let socket = args.socket.unwrap_or_else(default_socket);
    let mgr = AgentManager::load_from_dir(&dir)?;
    run_server(&socket, mgr).await?;
    Ok(())
}
