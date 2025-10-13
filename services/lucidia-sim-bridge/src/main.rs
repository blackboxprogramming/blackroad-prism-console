use std::env;
use std::fmt;
use std::net::SocketAddr;
use std::num::ParseIntError;
use std::time::Duration;

use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::{TcpStream, UdpSocket};
use tokio::signal;
use tokio::sync::watch;
use tokio::task::{JoinError, JoinSet};
use tokio::time::{interval, sleep, timeout, MissedTickBehavior};

#[tokio::main]
async fn main() -> Result<(), BridgeError> {
    let config = Config::from_env()?;
    let bridge = SimBridge::new(config);
    bridge.run().await
}

#[derive(Clone, Debug)]
struct Config {
    trick_host: String,
    trick_port: u16,
    trick_connect_timeout: Duration,
    trick_heartbeat: Duration,
    reconnect_backoff: Duration,
    cfs_tlm_bind: SocketAddr,
    cfs_cmd_target: SocketAddr,
    bus_endpoint: String,
    telemetry_topic: String,
    command_topic: String,
    write_enabled: bool,
    max_packet_size: usize,
    preview_bytes: usize,
}

impl Config {
    fn from_env() -> Result<Self, ConfigError> {
        let trick_host = env::var("SIM_TRICK_HOST").unwrap_or_else(|_| "127.0.0.1".into());
        let trick_port = Self::parse_port("SIM_TRICK_PORT", 7000)?;
        let trick_connect_timeout = Self::parse_duration("SIM_TRICK_TIMEOUT_SECS", 5)?;
        let trick_heartbeat = Self::parse_duration("SIM_TRICK_HEARTBEAT_SECS", 2)?;
        let reconnect_backoff = Self::parse_duration("SIM_RECONNECT_SECS", 3)?;

        let cfs_tlm_bind = Self::parse_socket("SIM_CFS_TLM_BIND", "0.0.0.0:7001")?;
        let cfs_cmd_target = Self::parse_socket("SIM_CFS_CMD_TARGET", "127.0.0.1:7002")?;

        let bus_endpoint = env::var("SIM_BUS_ENDPOINT")
            .unwrap_or_else(|_| "ipc:///var/run/lucidia_sim_bus.sock".into());
        let telemetry_topic = env::var("SIM_TELEMETRY_TOPIC")
            .unwrap_or_else(|_| "lucidia://bus/sim/telemetry".into());
        let command_topic =
            env::var("SIM_COMMAND_TOPIC").unwrap_or_else(|_| "lucidia://bus/sim/command".into());

        let write_enabled = env::var("SIM_WRITE_ENABLED")
            .map(|value| matches!(value.trim(), "1" | "true" | "TRUE" | "True"))
            .unwrap_or(false);

        let max_packet_size = Self::parse_usize("SIM_MAX_PACKET_BYTES", 4096)?;
        let preview_bytes = Self::parse_usize("SIM_LOG_PREVIEW_BYTES", 8)?.min(max_packet_size);

        Ok(Self {
            trick_host,
            trick_port,
            trick_connect_timeout,
            trick_heartbeat,
            reconnect_backoff,
            cfs_tlm_bind,
            cfs_cmd_target,
            bus_endpoint,
            telemetry_topic,
            command_topic,
            write_enabled,
            max_packet_size,
            preview_bytes,
        })
    }

    fn parse_port(var: &'static str, default: u16) -> Result<u16, ConfigError> {
        let raw = env::var(var).unwrap_or_else(|_| default.to_string());
        raw.parse::<u16>()
            .map_err(|source| ConfigError::InvalidPort {
                var,
                value: raw,
                source,
            })
    }

    fn parse_socket(var: &'static str, default: &str) -> Result<SocketAddr, ConfigError> {
        let raw = env::var(var).unwrap_or_else(|_| default.to_string());
        raw.parse::<SocketAddr>()
            .map_err(|source| ConfigError::InvalidSocket {
                var,
                value: raw,
                source,
            })
    }

    fn parse_duration(var: &'static str, default_secs: u64) -> Result<Duration, ConfigError> {
        let raw = env::var(var).unwrap_or_else(|_| default_secs.to_string());
        let secs = raw
            .parse::<u64>()
            .map_err(|source| ConfigError::InvalidDuration {
                var,
                value: raw,
                source,
            })?;
        Ok(Duration::from_secs(secs.max(1)))
    }

    fn parse_usize(var: &'static str, default: usize) -> Result<usize, ConfigError> {
        let raw = env::var(var).unwrap_or_else(|_| default.to_string());
        raw.parse::<usize>()
            .map_err(|source| ConfigError::InvalidPacketSize {
                var,
                value: raw,
                source,
            })
            .map(|value| value.max(1))
    }
}

struct SimBridge {
    config: Config,
}

impl SimBridge {
    fn new(config: Config) -> Self {
        Self { config }
    }

    async fn run(&self) -> Result<(), BridgeError> {
        println!("lucidia-sim-bridge starting…");
        println!(
            "Trick variable server: {}:{}",
            self.config.trick_host, self.config.trick_port
        );
        println!("cFS telemetry bind: {}", self.config.cfs_tlm_bind);
        println!("cFS command target: {}", self.config.cfs_cmd_target);
        println!("Lucidia bus endpoint: {}", self.config.bus_endpoint);
        println!(
            "Telemetry topic: {} | Command topic: {}",
            self.config.telemetry_topic, self.config.command_topic
        );
        println!("write operations enabled: {}", self.config.write_enabled);

        let (shutdown_tx, shutdown_rx) = watch::channel(false);
        let mut tasks = JoinSet::new();

        tasks.spawn(Self::monitor_trick(
            self.config.clone(),
            shutdown_rx.clone(),
        ));
        tasks.spawn(Self::listen_cfs(self.config.clone(), shutdown_rx.clone()));

        if self.config.write_enabled {
            tasks.spawn(Self::command_ready(
                self.config.clone(),
                shutdown_rx.clone(),
            ));
        }

        let mut early_error: Option<BridgeError> = None;

        tokio::select! {
            _ = signal::ctrl_c() => {
                println!("shutdown signal received, draining tasks…");
            }
            res = tasks.join_next() => {
                if let Some(res) = res {
                    match res {
                        Ok(inner) => if let Err(err) = inner { early_error = Some(err); },
                        Err(err) => early_error = Some(BridgeError::Join(err)),
                    }
                }
            }
        }

        let _ = shutdown_tx.send(true);

        while let Some(res) = tasks.join_next().await {
            match res {
                Ok(inner) => {
                    if let Err(err) = inner {
                        if early_error.is_none() {
                            early_error = Some(err);
                        }
                    }
                }
                Err(err) => {
                    if early_error.is_none() {
                        early_error = Some(BridgeError::Join(err));
                    }
                }
            }
        }

        if let Some(err) = early_error {
            return Err(err);
        }

        println!("lucidia-sim-bridge shutdown complete");
        Ok(())
    }

    async fn monitor_trick(
        config: Config,
        mut shutdown: watch::Receiver<bool>,
    ) -> Result<(), BridgeError> {
        loop {
            if *shutdown.borrow() {
                break;
            }

            match Self::establish_trick_session(&config, shutdown.clone()).await {
                Ok(()) => {
                    if *shutdown.borrow() {
                        break;
                    }
                    println!(
                        "Trick session closed; retrying in {:?}",
                        config.reconnect_backoff
                    );
                }
                Err(err) => {
                    eprintln!("Trick session error: {}", err);
                }
            }

            tokio::select! {
                _ = shutdown.changed() => {
                    if *shutdown.borrow() {
                        break;
                    }
                }
                _ = sleep(config.reconnect_backoff) => {}
            }
        }

        println!("Trick monitor terminated");
        Ok(())
    }

    async fn establish_trick_session(
        config: &Config,
        shutdown: watch::Receiver<bool>,
    ) -> Result<(), BridgeError> {
        let target = format!("{}:{}", config.trick_host, config.trick_port);
        println!("Attempting Trick connection to {}", target);

        let stream = match timeout(config.trick_connect_timeout, TcpStream::connect(&target)).await
        {
            Ok(Ok(stream)) => stream,
            Ok(Err(err)) => return Err(BridgeError::Io(err)),
            Err(err) => return Err(BridgeError::Timeout(err)),
        };

        println!("Connected to Trick variable server at {}", target);
        let result = Self::trick_session(stream, config, shutdown).await;

        if let Err(err) = &result {
            eprintln!("Trick session terminated with error: {}", err);
        }

        result
    }

    async fn trick_session(
        stream: TcpStream,
        config: &Config,
        mut shutdown: watch::Receiver<bool>,
    ) -> Result<(), BridgeError> {
        let (reader, mut writer) = stream.into_split();
        let mut reader = BufReader::new(reader);
        let mut line = String::new();

        writer
            .write_all(b"# lucidia-sim-bridge handshake\n")
            .await
            .map_err(BridgeError::Io)?;

        let ack = timeout(Duration::from_secs(1), reader.read_line(&mut line)).await;
        match ack {
            Ok(Ok(bytes)) if bytes > 0 => {
                println!("Trick handshake acknowledged: {}", line.trim());
            }
            Ok(Ok(_)) => {
                println!("Trick handshake completed without response");
            }
            Ok(Err(err)) => return Err(BridgeError::Io(err)),
            Err(_) => {
                println!("Trick handshake timed out waiting for acknowledgement");
            }
        }
        line.clear();

        let mut heartbeat = interval(config.trick_heartbeat);
        heartbeat.set_missed_tick_behavior(MissedTickBehavior::Delay);

        loop {
            tokio::select! {
                _ = shutdown.changed() => {
                    if *shutdown.borrow() {
                        println!("Shutting down Trick session");
                        break;
                    }
                }
                result = reader.read_line(&mut line) => {
                    match result {
                        Ok(0) => {
                            println!("Trick server closed the connection");
                            break;
                        }
                        Ok(_) => {
                            let payload = line.trim_end_matches(['\r', '\n']);
                            if !payload.is_empty() {
                                Self::publish_to_bus(
                                    &config.bus_endpoint,
                                    &config.telemetry_topic,
                                    payload.as_bytes(),
                                    config.preview_bytes,
                                )
                                .await?;
                            }
                            line.clear();
                        }
                        Err(err) => return Err(BridgeError::Io(err)),
                    }
                }
                _ = heartbeat.tick() => {
                    writer
                        .write_all(b"# lucidia heartbeat\n")
                        .await
                        .map_err(BridgeError::Io)?;
                }
            }
        }

        Ok(())
    }

    async fn listen_cfs(
        config: Config,
        mut shutdown: watch::Receiver<bool>,
    ) -> Result<(), BridgeError> {
        let socket = UdpSocket::bind(config.cfs_tlm_bind)
            .await
            .map_err(BridgeError::Io)?;
        println!(
            "Listening for cFS telemetry on {} (max {} bytes)",
            socket.local_addr().map_err(BridgeError::Io)?,
            config.max_packet_size
        );

        let mut buffer = vec![0u8; config.max_packet_size];

        loop {
            tokio::select! {
                _ = shutdown.changed() => {
                    if *shutdown.borrow() {
                        println!("Telemetry listener shutting down");
                        break;
                    }
                }
                result = socket.recv_from(&mut buffer) => {
                    match result {
                        Ok((len, addr)) => {
                            let packet = &buffer[..len];
                            Self::publish_to_bus(
                                &config.bus_endpoint,
                                &config.telemetry_topic,
                                packet,
                                config.preview_bytes,
                            ).await?;
                            println!("Forwarded telemetry packet ({} bytes) from {}", len, addr);
                        }
                        Err(err) => {
                            return Err(BridgeError::Io(err));
                        }
                    }
                }
            }
        }

        Ok(())
    }

    async fn command_ready(
        config: Config,
        mut shutdown: watch::Receiver<bool>,
    ) -> Result<(), BridgeError> {
        println!(
            "Command forwarding enabled -> {} (topic {})",
            config.cfs_cmd_target, config.command_topic
        );

        while !*shutdown.borrow() {
            tokio::select! {
                _ = shutdown.changed() => {
                    if *shutdown.borrow() {
                        break;
                    }
                }
                _ = sleep(Duration::from_secs(1)) => {
                    // Placeholder for future command ingestion logic.
                }
            }
        }

        println!("Command forwarder shutting down");
        Ok(())
    }

    async fn publish_to_bus(
        endpoint: &str,
        topic: &str,
        payload: &[u8],
        preview_bytes: usize,
    ) -> Result<(), BridgeError> {
        let preview = hex_preview(payload, preview_bytes);
        println!(
            "[bus] {} -> {} | {} bytes | preview: {}",
            endpoint,
            topic,
            payload.len(),
            preview
        );
        Ok(())
    }
}

#[derive(Debug)]
enum ConfigError {
    InvalidPort {
        var: &'static str,
        value: String,
        source: ParseIntError,
    },
    InvalidSocket {
        var: &'static str,
        value: String,
        source: std::net::AddrParseError,
    },
    InvalidDuration {
        var: &'static str,
        value: String,
        source: ParseIntError,
    },
    InvalidPacketSize {
        var: &'static str,
        value: String,
        source: ParseIntError,
    },
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidPort { var, value, .. } => {
                write!(f, "invalid port for {}: {}", var, value)
            }
            Self::InvalidSocket { var, value, .. } => {
                write!(f, "invalid socket address for {}: {}", var, value)
            }
            Self::InvalidDuration { var, value, .. } => {
                write!(f, "invalid duration for {}: {}", var, value)
            }
            Self::InvalidPacketSize { var, value, .. } => {
                write!(f, "invalid packet size for {}: {}", var, value)
            }
        }
    }
}

impl std::error::Error for ConfigError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Self::InvalidPort { source, .. }
            | Self::InvalidDuration { source, .. }
            | Self::InvalidPacketSize { source, .. } => Some(source),
            Self::InvalidSocket { source, .. } => Some(source),
        }
    }
}

#[derive(Debug)]
enum BridgeError {
    Config(ConfigError),
    Io(std::io::Error),
    Timeout(tokio::time::error::Elapsed),
    Join(JoinError),
}

impl fmt::Display for BridgeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Config(err) => write!(f, "configuration error: {}", err),
            Self::Io(err) => write!(f, "I/O error: {}", err),
            Self::Timeout(err) => write!(f, "operation timed out: {}", err),
            Self::Join(err) => write!(f, "task join error: {}", err),
        }
    }
}

impl std::error::Error for BridgeError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Self::Config(err) => Some(err),
            Self::Io(err) => Some(err),
            Self::Timeout(err) => Some(err),
            Self::Join(err) => Some(err),
        }
    }
}

impl From<ConfigError> for BridgeError {
    fn from(err: ConfigError) -> Self {
        Self::Config(err)
    }
}

impl From<std::io::Error> for BridgeError {
    fn from(err: std::io::Error) -> Self {
        Self::Io(err)
    }
}

impl From<tokio::time::error::Elapsed> for BridgeError {
    fn from(err: tokio::time::error::Elapsed) -> Self {
        Self::Timeout(err)
    }
}

impl From<JoinError> for BridgeError {
    fn from(err: JoinError) -> Self {
        Self::Join(err)
    }
}

fn hex_preview(payload: &[u8], preview_bytes: usize) -> String {
    if payload.is_empty() || preview_bytes == 0 {
        return String::from("<empty>");
    }

    let limit = preview_bytes.min(payload.len());
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut out = String::with_capacity(limit * 2 + 1);

    for &byte in &payload[..limit] {
        out.push(HEX[(byte >> 4) as usize] as char);
        out.push(HEX[(byte & 0x0f) as usize] as char);
    }

    if payload.len() > limit {
        out.push('…');
    }

    out
}
