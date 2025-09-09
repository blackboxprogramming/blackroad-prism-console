#!/usr/bin/env python3
import os, time, json, math, threading, urllib.request
from rpi_ws281x import PixelStrip, Color

PIN=int(os.getenv("LED_PIN",18)); N=int(os.getenv("LED_COUNT",16))
B=float(os.getenv("BRIGHT","0.35"))
API=os.getenv("BACKPLANE_URL","http://127.0.0.1:4000")
KEY=os.getenv("BR_KEY","" ); DEV=os.getenv("DEVICE_ID","pi-01")

strip=PixelStrip(N, PIN, brightness=int(B*255), autoWrite=False); strip.begin()
state={"mode":"emotion","emotion":"ok","progress":0,"until":0}
lock=threading.Lock()

def C(r,g,b): return Color(int(r),int(g),int(b))
PAL={"ok":C(20,170,80),"busy":C(230,170,40),"hot":C(255,40,30),"thinking":C(40,120,255),"error":C(255,0,0),"help":C(0,200,220)}

def wheel(pos):
  if pos<85:   return C(pos*3,255-pos*3,0)
  if pos<170:  pos-=85; return C(255-pos*3,0,pos*3)
  pos-=170;    return C(0,pos*3,255-pos*3)

def draw(t):
  m=state["mode"]; emo=state["emotion"]
  if m=="progress":
    pct=state["progress"]; lit=int((pct/100.0)*N)
    for i in range(N): strip.setPixelColor(i, C(20,120,250) if i<lit else C(5,10,20))
  elif emo=="help":
    v=(math.sin(t*4)+1)/2; col=(0,int(100+120*v),int(140+80*v))
    for i in range(N): strip.setPixelColor(i, C(*col))
  elif emo=="ok":
    for i in range(N): strip.setPixelColor(i, PAL["ok"])
  elif emo=="busy":
    v=(math.sin(t*2)+1)/2; col=(230,int(120+80*v),40)
    for i in range(N): strip.setPixelColor(i, C(*col))
  elif emo=="hot":
    v=(math.sin(t*6)+1)/2; col=(255,int(20+60*v),int(20+20*v))
    for i in range(N): strip.setPixelColor(i, C(*col))
  elif emo=="thinking":
    off=C(0,0,20); on=PAL["thinking"]; k=int((t*8)%N)
    for i in range(N): strip.setPixelColor(i, on if i==k else off)
  elif emo=="error":
    col=PAL["error"] if int(t*4)%2==0 else C(30,0,0)
    for i in range(N): strip.setPixelColor(i, col)
  elif emo=="celebrate":
    for i in range(N): strip.setPixelColor(i, wheel((i*256//N + int(t*256))%256))
  strip.show()

def post(path, body):
  req=urllib.request.Request(API+path, data=json.dumps(body).encode(), headers={"Content-Type":"application/json","X-BlackRoad-Key":KEY})
  try: urllib.request.urlopen(req, timeout=2)
  except: pass

def telemetry():
  while True:
    try: tc=int(open("/sys/class/thermal/thermal_zone0/temp").read())/1000.0
    except: tc=None
    post(f"/api/devices/{DEV}/telemetry", {"id":DEV,"role":"led","ts":time.strftime("%FT%T"),"cpu":tc})
    time.sleep(5)

def poll_commands():
  while True:
    try:
      req=urllib.request.Request(API+f"/api/devices/{DEV}/commands", headers={"X-BlackRoad-Key":KEY})
      with urllib.request.urlopen(req, timeout=10) as r:
        cmds=json.loads(r.read().decode())
        for c in cmds:
          p=c.get("payload") or c
          t=p.get("type")
          with lock:
            if t=="led.emotion":
              state["mode"]="emotion"; state["emotion"]=p.get("emotion","ok"); state["until"]=time.time()+p.get("ttl_s",60)
            elif t=="led.progress":
              state["mode"]="progress"; state["progress"]=max(0,min(100,int(p.get("pct",0)))); state["until"]=time.time()+p.get("ttl_s",120)
            elif t=="led.celebrate":
              state["mode"]="emotion"; state["emotion"]="celebrate"; state["until"]=time.time()+p.get("ttl_s",30)
    except: time.sleep(2)

if __name__=="__main__":
  import threading
  threading.Thread(target=telemetry, daemon=True).start()
  threading.Thread(target=poll_commands, daemon=True).start()
  t0=time.time()
  while True:
    with lock:
      # auto timeout back to ok
      if state["until"] and time.time()>state["until"]:
        state.update({"mode":"emotion","emotion":"ok","until":0})
      emo_now = ("hot" if (os.path.exists("/sys/class/thermal/thermal_zone0/temp") and
                 (lambda x:int(open(x).read())/1000.0)( "/sys/class/thermal/thermal_zone0/temp") )>=75 else state["emotion"])
      if state["mode"]=="emotion": state["emotion"]=emo_now
      draw(time.time()-t0)
    time.sleep(0.05)
