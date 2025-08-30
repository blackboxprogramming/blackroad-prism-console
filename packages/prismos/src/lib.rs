use once_cell::sync::OnceCell;
use std::collections::{HashMap, VecDeque};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::{mpsc, Arc, Mutex};
use std::thread::{self, JoinHandle};
use std::time::Duration;

#[derive(Clone)]
pub struct Agent {
    pub name: &'static str,
    pub state: AgentState,
    pub entrypoint: fn(),
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum AgentState {
    Running,
    Stopped,
    Crashed,
}

struct AgentRuntime {
    agent: Agent,
    handle: Option<JoinHandle<()>>,
    inbox: Arc<Mutex<VecDeque<String>>>,
    outbox: Arc<Mutex<VecDeque<String>>>,
    stop_tx: mpsc::Sender<()>,
    stop_rx: Arc<Mutex<mpsc::Receiver<()>>>,
}

static AGENT_TABLE: OnceCell<Mutex<HashMap<&'static str, AgentRuntime>>> = OnceCell::new();

fn table() -> &'static Mutex<HashMap<&'static str, AgentRuntime>> {
    AGENT_TABLE.get_or_init(|| Mutex::new(HashMap::new()))
}

fn ipc_dir() -> PathBuf {
    Path::new("prism/ipc").to_path_buf()
}

fn log_dir() -> PathBuf {
    Path::new("prism/logs").to_path_buf()
}

pub fn spawn_agent(agent: &Agent) {
    fs::create_dir_all(ipc_dir()).ok();
    fs::create_dir_all(log_dir()).ok();
    let mut tbl = table().lock().unwrap();
    if tbl.contains_key(agent.name) {
        return;
    }
    let (stop_tx, stop_rx) = mpsc::channel();
    let stop_rx_arc = Arc::new(Mutex::new(stop_rx));
    let inbox = Arc::new(Mutex::new(VecDeque::new()));
    let outbox = Arc::new(Mutex::new(VecDeque::new()));
    let agent_clone = agent.clone();
    let inbox_clone = inbox.clone();
    let outbox_clone = outbox.clone();
    let name = agent.name;
    let handle = thread::spawn(move || {
        let res = std::panic::catch_unwind(|| {
            (agent_clone.entrypoint)();
        });
        if res.is_err() {
            let mut tbl = table().lock().unwrap();
            if let Some(rt) = tbl.get_mut(name) {
                rt.agent.state = AgentState::Crashed;
            }
            let path = log_dir().join(format!("{}.log", name));
            if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(path) {
                let _ = writeln!(f, "agent {} crashed", name);
            }
        }
    });
    tbl.insert(
        agent.name,
        AgentRuntime {
            agent: Agent {
                state: AgentState::Running,
                ..agent.clone()
            },
            handle: Some(handle),
            inbox: inbox_clone,
            outbox: outbox_clone,
            stop_tx,
            stop_rx: stop_rx_arc,
        },
    );
}

pub fn stop_agent(agent: &mut Agent) {
    let mut tbl = table().lock().unwrap();
    if let Some(rt) = tbl.get_mut(agent.name) {
        let _ = rt.stop_tx.send(());
        if let Some(handle) = rt.handle.take() {
            let _ = handle.join();
        }
        rt.agent.state = AgentState::Stopped;
        agent.state = AgentState::Stopped;
    }
}

pub fn restart_agent(agent: &mut Agent) {
    stop_agent(agent);
    spawn_agent(agent);
}

pub fn send_message(agent: &str, msg: &str) {
    let tbl = table().lock().unwrap();
    if let Some(rt) = tbl.get(agent) {
        let mut inbox = rt.inbox.lock().unwrap();
        inbox.push_back(msg.to_string());
    }
}

pub fn recv_message(agent: &str) -> Option<String> {
    let tbl = table().lock().unwrap();
    if let Some(rt) = tbl.get(agent) {
        let mut outbox = rt.outbox.lock().unwrap();
        outbox.pop_front()
    } else {
        None
    }
}

fn agent_recv(agent: &str) -> Option<String> {
    let tbl = table().lock().unwrap();
    tbl.get(agent)
        .and_then(|rt| rt.inbox.lock().unwrap().pop_front())
}

fn agent_send(agent: &str, msg: &str) {
    let tbl = table().lock().unwrap();
    if let Some(rt) = tbl.get(agent) {
        let mut outbox = rt.outbox.lock().unwrap();
        outbox.push_back(msg.to_string());
        let path = ipc_dir().join(agent);
        if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(path) {
            let _ = writeln!(f, "{}", msg);
        }
    }
}

fn should_stop(agent: &str) -> bool {
    let tbl = table().lock().unwrap();
    if let Some(rt) = tbl.get(agent) {
        let rx = rt.stop_rx.lock().unwrap();
        rx.try_recv().is_ok()
    } else {
        true
    }
}

pub fn list_agents() -> Vec<(String, AgentState)> {
    let tbl = table().lock().unwrap();
    tbl.values()
        .map(|rt| (rt.agent.name.to_string(), rt.agent.state))
        .collect()
}

fn system_agent() {
    loop {
        if should_stop("system") {
            break;
        }
        agent_send("system", "heartbeat");
        thread::sleep(Duration::from_secs(1));
    }
}

fn echo_agent() {
    loop {
        if should_stop("echo") {
            break;
        }
        if let Some(msg) = agent_recv("echo") {
            if msg == "panic" {
                panic!("echo agent crash");
            }
            agent_send("echo", &msg);
        } else {
            thread::sleep(Duration::from_millis(100));
        }
    }
}

pub fn boot() {
    let system = Agent {
        name: "system",
        state: AgentState::Stopped,
        entrypoint: system_agent,
    };
    spawn_agent(&system);
    let echo = Agent {
        name: "echo",
        state: AgentState::Stopped,
        entrypoint: echo_agent,
    };
    spawn_agent(&echo);
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn echo_roundtrip() {
        boot();
        send_message("echo", "hello");
        for _ in 0..20 {
            if let Some(msg) = recv_message("echo") {
                assert_eq!(msg, "hello");
                return;
            }
            thread::sleep(Duration::from_millis(100));
        }
        panic!("no message");
    }

    #[test]
    fn echo_crash() {
        boot();
        send_message("echo", "panic");
        thread::sleep(Duration::from_millis(200));
        let agents = list_agents();
        let state = agents.into_iter().find(|(n, _)| n == "echo").unwrap().1;
        assert_eq!(state, AgentState::Crashed);
        let log_path = log_dir().join("echo.log");
        assert!(log_path.exists());
    }
}
