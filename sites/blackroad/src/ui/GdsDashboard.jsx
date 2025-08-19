import { useEffect, useRef } from "react";

export default function GdsDashboard() {
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket("wss://mission-control.blackroad.local/gds");
    wsRef.current = ws;
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      // TODO: handle telemetry, events, command acks
      console.log(msg);
    };
    return () => ws.close();
  }, []);

  return (
    <div>
      <div id="health"></div>
      <canvas id="telemetryChart" />
      <ul id="commandQueue"></ul>
    </div>
  );
}
