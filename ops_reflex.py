#!/usr/bin/env python3
import os, time, json, threading, collections
import paho.mqtt.client as mqtt

MQTT_HOST = os.getenv("MQTT_HOST","localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT","1883"))

# --- Tunables ---
TEMP_WARN_C = float(os.getenv("TEMP_WARN_C", "70"))
TEMP_CLEAR_C = float(os.getenv("TEMP_CLEAR_C","65"))
COOLDOWN_S  = int(os.getenv("COOLDOWN_S","15"))
GLOBAL_SPAM_GUARD_S = int(os.getenv("GLOBAL_SPAM_GUARD_S","5"))

# Missing heartbeat thresholds
LOST_AFTER_S       = int(os.getenv("LOST_AFTER_S","30"))  # consider missing after this
RECOVER_COOLDOWN_S = int(os.getenv("RECOVER_COOLDOWN_S","5"))

STATE_TOPIC = "ops/reflex/state"
ALERT_TOPIC = "ops/reflex/alert"
CMD_TOPIC   = "ops/reflex/cmd"

last_alert_by_node = collections.defaultdict(lambda: 0.0)
last_global_alert  = 0.0
hot_nodes          = set()     # over-temp
missing_nodes      = set()     # timed out
latest             = {}        # node -> last heartbeat dict
last_seen_ts       = {}        # node -> time.time() last message

def now(): return time.time()

def publish(mq, topic, payload):
    mq.publish(topic, json.dumps(payload), qos=1)

def alert(mq, kind, msg, meta=None):
    global last_global_alert
    t = now()
    if t - last_global_alert < GLOBAL_SPAM_GUARD_S:
        return
    last_global_alert = t
    payload = {"ts": t, "kind": kind, "msg": msg, "meta": meta or {}}
    publish(mq, ALERT_TOPIC, payload)
    # Displays
    publish(mq, "holo/cmd", {"mode":"text","text":msg,"duration_ms":4000,"params":{"size":48}})
    publish(mq, "sim/output", {"view":"panel","text":msg,"ttl_s":10})

def summarize_and_publish(mq):
    ok = [n for n in latest if n not in hot_nodes and n not in missing_nodes]
    payload = {
        "ts": now(),
        "nodes_seen": sorted(list(latest.keys())),
        "hot_nodes": sorted(list(hot_nodes)),
        "missing_nodes": sorted(list(missing_nodes)),
        "ok_nodes": sorted(ok),
        "thresholds": {
            "TEMP_WARN_C": TEMP_WARN_C,
            "TEMP_CLEAR_C": TEMP_CLEAR_C,
            "LOST_AFTER_S": LOST_AFTER_S
        }
    }
    publish(mq, STATE_TOPIC, payload)

def handle_cmd(payload):
    global TEMP_WARN_C, TEMP_CLEAR_C
    if "set" in payload and isinstance(payload["set"], dict):
        if "TEMP_WARN_C" in payload["set"]:
            TEMP_WARN_C = float(payload["set"]["TEMP_WARN_C"])
        if "TEMP_CLEAR_C" in payload["set"]:
            TEMP_CLEAR_C = float(payload["set"]["TEMP_CLEAR_C"])

def on_message(mq, u, msg):
    topic = msg.topic
    if topic.startswith("system/heartbeat/"):
        node = topic.split("/", 2)[-1]
        try:
            hb = json.loads(msg.payload.decode("utf-8"))
        except Exception:
            return
        latest[node] = hb
        last_seen_ts[node] = now()

        # If this node was missing and it just spoke, mark recovered
        if node in missing_nodes and (now() - last_seen_ts[node]) < RECOVER_COOLDOWN_S:
            missing_nodes.discard(node)
            alert(mq, "node_ok", f"✅ {node}: heartbeat restored", {"node": node})

        temp = hb.get("temp_c")
        t = now()
        if temp is not None:
            # Enter hot
            if temp >= TEMP_WARN_C and node not in hot_nodes:
                if t - last_alert_by_node[node] >= COOLDOWN_S:
                    hot_nodes.add(node)
                    last_alert_by_node[node] = t
                    alert(mq, "temp_high", f"⚠️ {node}: {temp:.1f}°C ≥ {TEMP_WARN_C:.1f}°C",
                          {"node": node, "temp_c": temp})
            # Exit hot
            elif temp <= TEMP_CLEAR_C and node in hot_nodes:
                hot_nodes.discard(node)
                alert(mq, "temp_ok", f"✅ {node}: {temp:.1f}°C ≤ {TEMP_CLEAR_C:.1f}°C",
                      {"node": node, "temp_c": temp})

        summarize_and_publish(mq)

    elif topic == CMD_TOPIC:
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
            handle_cmd(payload)
        except Exception:
            pass

def timeout_watcher(mq):
    # Background loop: mark nodes missing if quiet for too long
    while True:
        t = now()
        tripped = []
        for node, seen in list(last_seen_ts.items()):
            if node in missing_nodes:
                continue
            if (t - seen) >= LOST_AFTER_S:
                missing_nodes.add(node)
                tripped.append(node)
        if tripped:
            for node in tripped:
                alert(mq, "node_lost", f"🛑 {node}: heartbeat missing > {LOST_AFTER_S}s", {"node": node})
            summarize_and_publish(mq)
        time.sleep(2)

def main():
    mq = mqtt.Client(client_id="ops-reflex")
    mq.on_message = on_message
    mq.connect(MQTT_HOST, MQTT_PORT, 60)
    mq.subscribe("system/heartbeat/#")
    mq.subscribe(CMD_TOPIC)

    publish(mq, STATE_TOPIC, {"ts": now(), "status":"started",
                              "thresholds":{"TEMP_WARN_C": TEMP_WARN_C,
                                            "TEMP_CLEAR_C": TEMP_CLEAR_C,
                                            "LOST_AFTER_S": LOST_AFTER_S}})

    threading.Thread(target=timeout_watcher, args=(mq,), daemon=True).start()
    mq.loop_forever()

if __name__ == "__main__":
    main()
