use clap::{Parser, Subcommand};
use prismos::*;

#[derive(Parser)]
#[command(author, version, about)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    Agents,
    Restart { agent: String },
    Send { agent: String, msg: String },
    Recv { agent: String },
}

fn main() {
    boot();
    let cli = Cli::parse();
    match cli.command {
        Commands::Agents => {
            for (name, state) in list_agents() {
                println!("{}: {:?}", name, state);
            }
        }
        Commands::Restart { agent } => {
            let mut a = Agent {
                name: Box::leak(agent.into_boxed_str()),
                state: AgentState::Stopped,
                entrypoint: || {},
            };
            restart_agent(&mut a);
        }
        Commands::Send { agent, msg } => {
            send_message(&agent, &msg);
        }
        Commands::Recv { agent } => {
            if let Some(msg) = recv_message(&agent) {
                println!("{}", msg);
            }
        }
    }
}
