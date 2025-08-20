use anyhow::Result;
use futures::{SinkExt, StreamExt};
use ladls::{SecurityAssociation, Session};
use tokio_tungstenite::{connect_async, tungstenite::Message};
use url::Url;

#[tokio::main]
async fn main() -> Result<()> {
    let url = Url::parse("ws://localhost:9001")?;
    let (mut ws, _) = connect_async(url).await?;
    let sa = SecurityAssociation::new(0x42);
    let mut tx = Session::new_tx(sa);
    let frame = tx.seal(0, &[], b"ping")?;
    ws.send(Message::Binary(frame)).await?;
    if let Some(msg) = ws.next().await {
        println!("Received: {:?}", msg);
    }
    Ok(())
}
