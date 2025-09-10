/**
 * FILE: /var/www/blackroad/chat-panel.js
 * Purpose: Minimal SPA hook. Drop <div id="chat-panel-root"></div> where your "Chat" tab is,
 * then include <script src="/chat-panel.js" defer></script>. It injects an iframe to /llm-chat.html.
 */
(function () {
  function mount() {
    var root = document.getElementById("chat-panel-root");
    if (!root) return;
    root.innerHTML = "";
    var frame = document.createElement("iframe");
    frame.src = "/llm-chat.html";
    frame.style.width = "100%";
    frame.style.height = "75vh";
    frame.style.minHeight = "520px";
    frame.style.border = "1px solid #1b1b26";
    frame.style.borderRadius = "16px";
    frame.loading = "eager";
    root.appendChild(frame);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
