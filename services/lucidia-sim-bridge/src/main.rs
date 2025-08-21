use std::env;
use std::error::Error;

/// Bridge process between Trick Variable Server / cFS and Lucidia bus.
///
/// Currently a stub; implements startup and write gating. Telemetry and
/// command paths will be fleshed out in subsequent commits.
#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let write_enabled = match env::var("SIM_WRITE_ENABLED") {
        Ok(v) => v == "true",
        Err(_) => false,
    };

    println!("lucidia-sim-bridge starting…");
    println!("write operations enabled: {}", write_enabled);

    // TODO: connect to Trick Variable Server and cFS Software Bus
    // TODO: validate packets against protobuf schemas
    // TODO: publish events on lucidia://bus/sim/* via ZeroMQ or gRPC

    Ok(())
}
