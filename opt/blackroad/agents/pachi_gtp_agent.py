# FILE: /opt/blackroad/agents/pachi_gtp_agent.py
# Desc: Minimal, robust GTP client for the Pachi Go engine as a subprocess.
# Note: Pachi speaks GTP (responses start with '=' or '?', end with a blank line).
#       We don't expose raw GTP to users; only safe endpoints call this client.
# Refs: Pachi is a GTP client; don't expose GTP to untrusted users. See README.
#       https://github.com/pasky/pachi  (GTP client)
#       https://www.lysator.liu.se/~gunnar/gtp/  (GTP protocol)

import subprocess, threading, queue, shlex, time, atexit
from dataclasses import dataclass
from typing import Optional, List

class GTPError(Exception): ...

class _LineReader(threading.Thread):
    def __init__(self, stream):
        super().__init__(daemon=True)
        self.stream = stream
        self.q = queue.Queue()

    def run(self):
        for line in self.stream:
            self.q.put(line)

    def get(self, timeout=None):
        return self.q.get(timeout=timeout)

@dataclass
class PachiConfig:
    engine_path: str = "pachi"      # ensure `pachi` is on PATH
    size: int = 19
    komi: float = 6.5
    engine_args: Optional[List[str]] = None  # e.g., ["-t", "8"]

class PachiGTP:
    """
    Tiny GTP client for Pachi with a safe, minimal API.
    """
    def __init__(self, cfg: Optional[PachiConfig] = None):
        self.cfg = cfg or PachiConfig()
        args = [self.cfg.engine_path]
        if self.cfg.engine_args:
            args += self.cfg.engine_args

        self.proc = subprocess.Popen(
            args,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        self._out = _LineReader(self.proc.stdout)
        self._err = _LineReader(self.proc.stderr)
        self._out.start()
        self._err.start()
        atexit.register(self.close)

        # Basic board setup
        self.cmd(f"boardsize {self.cfg.size}")
        self.cmd(f"komi {self.cfg.komi}")
        self.cmd("clear_board")

    def close(self):
        try:
            if self.proc and self.proc.poll() is None:
                try:
                    self.cmd("quit")
                except Exception:
                    pass
                self.proc.terminate()
        except Exception:
            pass

    def cmd(self, line: str, timeout: float = 10.0) -> str:
        """
        Send a GTP command and return payload without the leading '='.
        """
        if not self.proc or self.proc.stdin.closed:
            raise GTPError("Engine process inactive.")
        self.proc.stdin.write(line.strip() + "\n")
        self.proc.stdin.flush()

        status = None
        payload_lines = []
        while True:
            try:
                raw = self._out.get(timeout=timeout)
            except queue.Empty:
                raise GTPError(f"GTP timeout for: {line!r}")
            s = raw.rstrip("\n")
            if s == "":
                break  # end of response
            if status is None:
                if s.startswith("="):
                    status = "="
                    s = s[1:].lstrip()
                    if s:
                        payload_lines.append(s)
                elif s.startswith("?"):
                    # Drain until blank line, then raise
                    status = "?"
                    msg = s[1:].lstrip() or f"GTP error for: {line}"
                    while True:
                        try:
                            more = self._out.get(timeout=timeout)
                        except queue.Empty:
                            break
                        if more.strip() == "":
                            break
                    raise GTPError(msg)
                else:
                    # Skip non-GTP chatter (banners)
                    continue
            else:
                payload_lines.append(s)
        if status != "=":
            raise GTPError(f"Unexpected GTP status for {line!r}: {status}")
        return "\n".join(payload_lines).strip()

    # High-level helpers
    def new_game(self, size: Optional[int] = None, komi: Optional[float] = None):
        if size is not None:
            self.cmd(f"boardsize {size}")
        if komi is not None:
            self.cmd(f"komi {komi}")
        self.cmd("clear_board")

    def play(self, color: str, move: str):
        """color in {'B','W'}; move like 'D4' or 'pass'."""
        return self.cmd(f"play {color.upper()} {move.upper()}")

    def genmove(self, color: str) -> str:
        return self.cmd(f"genmove {color.upper()}")

    def final_score(self) -> str:
        return self.cmd("final_score")

    def time_settings(self, main_s:int=1200, byo_s:int=30, byo_stones:int=0):
        """Standard GTP time_settings if supported by engine."""
        return self.cmd(f"time_settings {main_s} {byo_s} {byo_stones}")

if __name__ == "__main__":
    e = PachiGTP(PachiConfig(size=9))
    try:
        e.play("B", "D4")
        e.play("W", "E5")
        mv = e.genmove("B")
        print("Pachi suggests:", mv)
        print("Score (if over):", e.final_score())
    finally:
        e.close()
