use prism_core::{run_server, AgentManager, Command};
use std::fs;
use std::io::Write;
use std::path::Path;
use tempfile::tempdir;
use tokio::net::UnixStream;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

async fn start_server(dir: &Path, socket: &Path) {
    let mgr = AgentManager::load_from_dir(dir).unwrap();
    let socket = socket.to_path_buf();
    tokio::spawn(async move {
        run_server(&socket, mgr).await.unwrap();
    });
    // give server time to start
    tokio::time::sleep(std::time::Duration::from_millis(200)).await;
}

async fn send_cmd(socket: &Path, cmd: &Command) -> serde_json::Value {
    let mut stream = UnixStream::connect(socket).await.unwrap();
    let req = serde_json::to_vec(cmd).unwrap();
    stream.write_all(&req).await.unwrap();
    stream.shutdown().await.unwrap();
    let mut buf = Vec::new();
    stream.read_to_end(&mut buf).await.unwrap();
    let resp: prism_core::Response = serde_json::from_slice(&buf).unwrap();
    resp.data
}

#[tokio::test]
async fn register_agent_via_toml() {
    let dir = tempdir().unwrap();
    let agent = "name = \"api\"\nversion = \"1.0\"";
    let path = dir.path().join("api.toml");
    let mut f = fs::File::create(&path).unwrap();
    f.write_all(agent.as_bytes()).unwrap();
    let socket = dir.path().join("sock");
    start_server(dir.path(), &socket).await;
    let resp = send_cmd(&socket, &Command { cmd: "status".into(), agent: None }).await;
    assert_eq!(resp.as_array().unwrap().len(), 1);
}

#[tokio::test]
async fn prismctl_restart_agent() {
    let dir = tempdir().unwrap();
    let agent = "name = \"api\"\nversion = \"1.0\"";
    let path = dir.path().join("api.toml");
    let mut f = fs::File::create(&path).unwrap();
    f.write_all(agent.as_bytes()).unwrap();
    let socket = dir.path().join("sock");
    start_server(dir.path(), &socket).await;
    send_cmd(&socket, &Command { cmd: "restart".into(), agent: Some("api".into()) }).await;
    let resp = send_cmd(&socket, &Command { cmd: "status".into(), agent: None }).await;
    let status = resp.as_array().unwrap()[0].get("status").unwrap().as_str().unwrap();
    assert_eq!(status, "Running");
}

#[tokio::test]
async fn auto_restart_on_failure() {
    let dir = tempdir().unwrap();
    let agent = "name = \"api\"\nversion = \"1.0\"";
    let path = dir.path().join("api.toml");
    let mut f = fs::File::create(&path).unwrap();
    f.write_all(agent.as_bytes()).unwrap();
    let socket = dir.path().join("sock");
    start_server(dir.path(), &socket).await;
    send_cmd(&socket, &Command { cmd: "fail".into(), agent: Some("api".into()) }).await;
    let resp = send_cmd(&socket, &Command { cmd: "status".into(), agent: None }).await;
    let status = resp.as_array().unwrap()[0].get("status").unwrap().as_str().unwrap();
    assert_eq!(status, "Running");
}
