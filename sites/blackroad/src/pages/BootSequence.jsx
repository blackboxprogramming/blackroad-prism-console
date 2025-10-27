import { useEffect, useRef } from "react";
import "./BootSequence.css";

const SYSTEM_CHECKS = [
  { icon: "🔍", text: "Initializing hardware...", status: "CHECKING", delay: 500 },
  { icon: "💾", text: "Loading kernel modules...", status: "LOADING", delay: 800 },
  { icon: "🖥️", text: "Initializing display drivers...", status: "ACTIVE", delay: 1100 },
  { icon: "🌐", text: "Configuring network interfaces...", status: "READY", delay: 1400 },
  { icon: "🔐", text: "Loading security modules...", status: "SECURED", delay: 1700 },
  { icon: "🎨", text: "Starting graphical interface...", status: "RENDERING", delay: 2000 },
  { icon: "🚀", text: "Loading BlackRoad services...", status: "LAUNCHING", delay: 2300 },
  { icon: "✨", text: "Initializing agent environment...", status: "READY", delay: 2600 }
];

const SYSTEM_INFO = [
  { icon: "🧠", label: "Processor", value: "BCM2712 Quad-Core" },
  { icon: "💾", label: "Memory", value: "8 GB RAM" },
  { icon: "💿", label: "Storage", value: "128 GB SSD" },
  { icon: "🌡️", label: "Temperature", value: "42°C" }
];

const LAUNCH_MESSAGE = `🚀 Launching Desktop...\n\nIn production:\n• Load desktop environment\n• Start all services\n• Open welcome screen\n• Initialize agent hub\n• Connect to network\n• Ready for use!`;

const CONSOLE_ART = `
    ╔═══════════════════════════════════════╗
    ║                                       ║
    ║        BLACKROAD OS v1.0.0            ║
    ║     Raspberry Pi 5 Edition            ║
    ║                                       ║
    ║   BUILD: 2025.10.27                   ║
    ║   KERNEL: 6.6.31+rpt-rpi-v8           ║
    ║   ARCH: aarch64                       ║
    ║                                       ║
    ║   © 2025 BlackRoad Technologies       ║
    ║                                       ║
    ╚═══════════════════════════════════════╝

    Initializing system...
`;

function showLaunchAlert() {
  window.alert(LAUNCH_MESSAGE);
}

export default function BootSequence() {
  const particlesRef = useRef(null);
  const checksRef = useRef(null);
  const percentRef = useRef(null);
  const progressBarRef = useRef(null);
  const bootCompleteRef = useRef(null);

  useEffect(() => {
    const particleContainer = particlesRef.current;
    const checkItems = checksRef.current
      ? Array.from(checksRef.current.querySelectorAll(".check-item"))
      : [];
    const timeouts = [];

    if (particleContainer) {
      const colors = ["#ff4fd8", "#c753ff", "#06b6d4", "#10b981", "#fdba2d"];

      for (let i = 0; i < 50; i += 1) {
        const particle = document.createElement("div");
        particle.className = "particle";
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.setProperty("--tx", `${(Math.random() - 0.5) * 200}px`);
        particle.style.setProperty("--ty", `${(Math.random() - 0.5) * 200}px`);
        particle.style.animationDelay = `${Math.random() * 2}s`;

        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.background = color;
        particle.style.boxShadow = `0 0 10px ${color}`;

        particleContainer.appendChild(particle);
      }
    }

    let currentPercent = 0;
    const percentElement = percentRef.current;
    const progressBar = progressBarRef.current;
    const percentInterval = window.setInterval(() => {
      if (currentPercent < 100) {
        currentPercent += Math.random() * 3;
        if (currentPercent > 100) {
          currentPercent = 100;
        }
        if (percentElement) {
          percentElement.textContent = `${Math.floor(currentPercent)}%`;
        }
        if (progressBar) {
          progressBar.setAttribute("aria-valuenow", `${Math.floor(currentPercent)}`);
        }
      } else {
        window.clearInterval(percentInterval);
      }
    }, 100);

    const iconUpdateTimeouts = checkItems.flatMap((check) => {
      const delay = Number(check.dataset.delay) || 0;
      const activate = window.setTimeout(() => {
        check.classList.add("active");
        const icon = check.querySelector(".check-icon");
        if (icon) {
          icon.classList.add("loading");
        }
      }, delay);

      const complete = window.setTimeout(() => {
        check.classList.remove("active");
        check.classList.add("complete");
        const icon = check.querySelector(".check-icon");
        const status = check.querySelector(".check-status");
        if (icon) {
          icon.classList.remove("loading");
          icon.textContent = "✓";
        }
        if (status) {
          status.textContent = "OK";
        }
        const text = check.querySelector(".check-text");
        if (text) {
          // eslint-disable-next-line no-console
          console.log("✓ Check complete:", text.textContent);
        }
      }, delay + 800);

      return [activate, complete];
    });

    timeouts.push(...iconUpdateTimeouts);

    const bootScreenTimeout = window.setTimeout(() => {
      if (bootCompleteRef.current) {
        bootCompleteRef.current.classList.add("show");
      }
    }, 5000);
    timeouts.push(bootScreenTimeout);

    const handleKeyDown = (event) => {
      if (event.defaultPrevented) return;
      if (bootCompleteRef.current?.classList.contains("show")) {
        showLaunchAlert();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // eslint-disable-next-line no-console
    console.log(CONSOLE_ART);

    return () => {
      window.clearInterval(percentInterval);
      timeouts.forEach((id) => window.clearTimeout(id));
      document.removeEventListener("keydown", handleKeyDown);
      if (particleContainer) {
        particleContainer.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className="boot-sequence">
      <div className="particle-system" ref={particlesRef} aria-hidden="true" />

      <div className="boot-container">
        <div className="logo-container">
          <div className="logo-ring">
            <div className="logo-symbol" role="img" aria-label="Lightning bolt">
              ⚡
            </div>
          </div>
          <div className="os-name">BLACKROAD OS</div>
          <div className="os-tagline">RASPBERRY PI 5 • BUILD 2025.10.27</div>
        </div>

        <div className="loading-container">
          <div
            className="loading-bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
            ref={progressBarRef}
          >
            <div className="loading-fill" />
          </div>
          <div className="loading-percentage" ref={percentRef}>
            0%
          </div>
        </div>

        <div className="system-checks" ref={checksRef}>
          {SYSTEM_CHECKS.map(({ icon, text, status, delay }) => (
            <div className="check-item" data-delay={delay} key={text}>
              <div className="check-icon" aria-hidden="true">
                {icon}
              </div>
              <div className="check-text">{text}</div>
              <div className="check-status">{status}</div>
            </div>
          ))}
        </div>

        <div className="system-info">
          {SYSTEM_INFO.map(({ icon, label, value }) => (
            <div className="info-card" key={label}>
              <div className="info-icon" aria-hidden="true">
                {icon}
              </div>
              <div className="info-label">{label}</div>
              <div className="info-value">{value}</div>
            </div>
          ))}
        </div>

        <div className="welcome-message">
          <div className="welcome-text">Welcome to the future of computing</div>
          <div className="welcome-subtext">BlackRoad OS • Powered by Innovation</div>
        </div>
      </div>

      <div className="boot-complete" ref={bootCompleteRef}>
        <div className="complete-message">
          <div className="complete-icon" aria-hidden="true">
            ✓
          </div>
          <div className="complete-title">SYSTEM READY</div>
          <div className="complete-subtitle">BlackRoad OS has successfully loaded</div>
          <button type="button" className="press-key" onClick={showLaunchAlert}>
            Press Any Key to Continue
          </button>
        </div>
      </div>
    </div>
  );
}
