#!/usr/bin/env python3
import glob
import json
import os
import subprocess
import time
import urllib.request

ROLE = os.getenv("ROLE", "mini")  # mini|main
API = os.getenv("BACKPLANE_URL", "http://127.0.0.1:4000")
KEY = os.getenv("BR_KEY", "")
ID = os.getenv("DEVICE_ID", f"display-{ROLE}")
SLEEP_MIN = int(os.getenv("SLEEP_AFTER_MIN", "0"))  # 0 = disable auto-sleep

last_activity = time.time()
screen_state = "on"
saved_brightness = None


def api_get(path):
    req = urllib.request.Request(API + path, headers={"X-BlackRoad-Key": KEY})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode())


def sys(cmd):
    try:
        return subprocess.run(
            cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
        ).stdout
    except subprocess.CalledProcessError:
        return ""


def backlight_paths():
    dirs = sorted(glob.glob("/sys/class/backlight/*"))
    if dirs:
        return dirs[0]
    return None


def bl_set(value):
    """value: 0..100 (percent)"""
    global saved_brightness
    bl = backlight_paths()
    if not bl:
        return False
    try:
        maxb = int(open(os.path.join(bl, "max_brightness")).read().strip())
        if saved_brightness is None:
            saved_brightness = int(open(os.path.join(bl, "brightness")).read().strip())
        new = max(0, min(maxb, int(round(value / 100.0 * maxb))))
        open(os.path.join(bl, "brightness"), "w").write(str(new))
        return True
    except Exception:
        # try bl_power (0=on, 4=off commonly)
        try:
            open(os.path.join(bl, "bl_power"), "w").write("4" if value == 0 else "0")
            return True
        except Exception:
            return False


def hdmi_power(on: bool):
    # Prefer vcgencmd; fallback to xset if DISPLAY set
    if subprocess.run(["which", "vcgencmd"], stdout=subprocess.DEVNULL).returncode == 0:
        sys(["vcgencmd", "display_power", "1" if on else "0"])
        return True
    if os.environ.get("DISPLAY"):
        if on:
            sys(["xset", "dpms", "force", "on"])
        else:
            sys(["xset", "dpms", "force", "off"])
        return True
    return False


def screen_sleep():
    global screen_state
    if screen_state == "off":
        return
    # Try backlight first (silent if not present), then HDMI
    bl_set(0)
    hdmi_power(False)
    screen_state = "off"


def screen_wake():
    global screen_state, saved_brightness
    if screen_state == "on":
        return
    hdmi_power(True)
    # restore brightness (or 70%)
    if saved_brightness is not None and backlight_paths():
        try:
            open(os.path.join(backlight_paths(), "brightness"), "w").write(str(saved_brightness))
        except Exception:
            bl_set(70)
    else:
        bl_set(70)
    screen_state = "on"


def show(cmd):
    global last_activity
    mode = cmd.get("mode", "image")
    src = cmd.get("src")
    target = cmd.get("target", "mini")
    _fit = cmd.get("fit", "contain")
    if ROLE not in (target, "both"):
        return
    last_activity = time.time()
    screen_wake()
    if mode == "image":
        subprocess.Popen(["feh", "-F", "-Z", "--auto-zoom", src])
    elif mode == "video":
        subprocess.Popen(["mpv", "--fs", src])
    elif mode == "url":
        subprocess.Popen(["chromium-browser", "--kiosk", src])


def loop():
    global last_activity
    while True:
        try:
            cmds = api_get(f"/api/devices/{ID}/commands")
            for c in cmds:
                p = c.get("payload") or c
                t = p.get("type", "")
                if t == "display.show":
                    show(p)
                elif t == "display.clear":
                    for proc in ("feh", "mpv", "chromium-browser"):
                        subprocess.call(["pkill", "-9", proc])
                elif t == "display.sleep":
                    screen_sleep()
                elif t == "display.wake":
                    last_activity = time.time()
                    screen_wake()
                elif t == "display.brightness":
                    v = int(p.get("value", 70))
                    bl_set(max(0, min(100, v)))
                    last_activity = time.time()
        except Exception:
            time.sleep(2)

        # Idle auto-sleep
        if (
            SLEEP_MIN > 0
            and screen_state == "on"
            and (time.time() - last_activity) > (SLEEP_MIN * 60)
        ):
            screen_sleep()
        time.sleep(2)


if __name__ == "__main__":
    loop()
