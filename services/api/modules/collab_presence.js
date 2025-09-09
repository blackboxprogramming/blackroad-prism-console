// Collab presence/focus namespace. No CRDT yet (LWW state).
// Events:
//  - join {user:{id,name,color}, room, file?}
//  - presence {file, cursor:{line,col}}
//  - focus {file, func?}  [broadcasts + optional devices display.show]
//  - help {on:true|false} [triggers LED cyan + audit]
const crypto = require("crypto");
module.exports = function attachCollab({ app, io }) {
  if (!io || !app) throw new Error("collab_presence: need {app, io}");
  const nsp = io.of("/collab");
  const ROOMS = new Map(); // room -> { users: Map<socket.id, state>, focus: {...} }

  function getRoom(name) {
    if (!ROOMS.has(name)) ROOMS.set(name, { users: new Map(), focus: null });
    return ROOMS.get(name);
  }
  function listUsers(room) {
    return Array.from(room.users.values()).map(u => ({
      id: u.user.id, name: u.user.name, color: u.user.color, file: u.file, cursor: u.cursor
    }));
  }

  nsp.on("connection", (sock) => {
    let currentRoom = null;
    let state = null;

    sock.on("join", ({ user, room, file }) => {
      if (!user || !room) return;
      currentRoom = String(room);
      const r = getRoom(currentRoom);
      state = {
        user: {
          id: user.id || crypto.randomUUID(),
          name: user.name || "anon",
          color: user.color || "#0096FF"
        },
        file: file || null,
        cursor: null
      };
      sock.join(currentRoom);
      r.users.set(sock.id, state);
      nsp.to(currentRoom).emit("presence:list", listUsers(r));
      if (r.focus) sock.emit("focus:now", r.focus);
    });

    sock.on("presence", ({ file, cursor }) => {
      if (!currentRoom || !state) return;
      const r = getRoom(currentRoom);
      if (file) state.file = file;
      if (cursor) state.cursor = cursor;
      r.users.set(sock.id, state);
      nsp.to(currentRoom).emit("presence:list", listUsers(r));
    });

    sock.on("focus", async ({ file, func }) => {
      if (!currentRoom) return;
      const r = getRoom(currentRoom);
      r.focus = { file, func, ts: Date.now() };
      nsp.to(currentRoom).emit("focus:now", r.focus);
      // Optional: mirror to devices (main display)
      try {
        const payload = {
          type: "display.show",
          target: "main",
          mode: "image", // render text card via data URL
          src: "data:text/plain;charset=utf-8," + encodeURIComponent(`FOCUS:\n${file||""}\n${func||""}`)
        };
        await fetch("http://127.0.0.1:4000/api/devices/display-main/command", {
          method: "POST",
          headers: {"Content-Type":"application/json","X-BlackRoad-Key": (process.env.ORIGIN_KEY || "")},
          body: JSON.stringify(payload)
        }).catch(()=>{});
      } catch {}
    });

    sock.on("help", async ({ on }) => {
      if (!currentRoom) return;
      nsp.to(currentRoom).emit("help", { on: !!on, ts: Date.now() });
      // LEDs cyan pulse
      try {
        const payload = { type: "led.emotion", emotion: on ? "help" : "ok", ttl_s: 90 };
        await fetch("http://127.0.0.1:4000/api/devices/pi-01/command", {
          method:"POST",
          headers:{"Content-Type":"application/json","X-BlackRoad-Key": (process.env.ORIGIN_KEY || "")},
          body: JSON.stringify(payload)
        }).catch(()=>{});
      } catch {}
    });

    sock.on("disconnect", () => {
      if (!currentRoom) return;
      const r = getRoom(currentRoom);
      r.users.delete(sock.id);
      nsp.to(currentRoom).emit("presence:list", listUsers(r));
    });
  });

  console.log("[collab] presence/focus namespace attached");
};
