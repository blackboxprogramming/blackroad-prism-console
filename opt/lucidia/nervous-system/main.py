"""Minimal nervous-system prototype (Phase 0)
- Event bus + ThalamusBroker (routing)
- ReflexServer (nociceptor -> withdrawal)
- BasalGanglia (action gating using modulators)
- Cerebellum (simple feed-forward correction)
- Neuromodulators (dopamine, norepinephrine, serotonin, acetylcholine)
- STDP synapse (nociceptor -> motor-withdrawal)
- SleepMaintenance (synaptic renormalization)
No external dependencies. Python 3.10+ recommended.
"""

from __future__ import annotations
import asyncio
import math
import random
import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Callable, Dict, List, Tuple, Any, Coroutine, Optional

# -----------------------
# Core messaging
# -----------------------

@dataclass(order=True)
class _QItem:
    # PriorityQueue sorts smallest first; we invert priority to pop highest first
    sort_index: Tuple[int, float] = field(init=False)
    priority: int
    ts: float
    event: "Event"

    def __post_init__(self):
        # Higher event.priority should come first -> use negative
        self.sort_index = (-self.priority, self.ts)

@dataclass
class Event:
    topic: str
    payload: Dict[str, Any]
    priority: int = 0
    ts: float = field(default_factory=lambda: time.time())

Subscriber = Callable[[Event], Coroutine[Any, Any, None]]

class EventBus:
    def __init__(self):
        self._subs: Dict[str, List[Tuple[int, Subscriber]]] = {}
        self._queue: asyncio.PriorityQueue[_QItem] = asyncio.PriorityQueue()

    def subscribe(self, topic: str, callback: Subscriber, sub_priority: int = 0) -> None:
        self._subs.setdefault(topic, []).append((sub_priority, callback))
        # Keep highest subscriber priority first (so reflex handlers run first locally)
        self._subs[topic].sort(key=lambda x: -x[0])

    async def publish(self, topic: str, payload: Dict[str, Any], priority: int = 0) -> None:
        await self._queue.put(_QItem(priority=priority, ts=time.time(),
                                     event=Event(topic=topic, payload=payload, priority=priority)))

    async def get_next_item(self) -> _QItem:
        return await self._queue.get()

    def subscribers_for(self, topic: str) -> List[Tuple[int, Subscriber]]:
        return self._subs.get(topic, [])


# -----------------------
# Thalamus: central router / attention broker
# -----------------------

class ThalamusBroker:
    def __init__(self, bus: EventBus):
        self.bus = bus
        # QoS knobs could be expanded per-topic
        self.drop_if_low_priority_below = -999  # no dropping in this minimal build

    async def run(self):
        print("[Thalamus] online")
        while True:
            qitem = await self.bus.get_next_item()
            event = qitem.event
            # (QoS hooks would go here)
            for _, callback in self.bus.subscribers_for(event.topic):
                # Fire-and-forget: each subscriber runs in its own task
                asyncio.create_task(callback(event))


# -----------------------
# Global Neuromodulators
# -----------------------

@dataclass
class Modulators:
    dopamine: float = 0.5        # reward / vigor (0..1)
    norepinephrine: float = 0.3  # alerting / arousal (0..1)
    serotonin: float = 0.5       # patience / stability (0..1)
    acetylcholine: float = 0.5   # attention / plasticity gating (0..1)

    def clamp(self):
        self.dopamine = min(max(self.dopamine, 0.0), 1.0)
        self.norepinephrine = min(max(self.norepinephrine, 0.0), 1.0)
        self.serotonin = min(max(self.serotonin, 0.0), 1.0)
        self.acetylcholine = min(max(self.acetylcholine, 0.0), 1.0)

class ModulatorCenter:
    def __init__(self, bus: EventBus, mods: Modulators):
        self.bus = bus
        self.mods = mods
        self.bus.subscribe("modulator/set", self.on_set, sub_priority=0)
        self.bus.subscribe("modulator/nudge", self.on_nudge, sub_priority=0)

    async def on_set(self, e: Event):
        for k, v in e.payload.items():
            if hasattr(self.mods, k):
                setattr(self.mods, k, float(v))
        self.mods.clamp()
        print(f"[Mods] set -> {self.mods}")

    async def on_nudge(self, e: Event):
        for k, dv in e.payload.items():
            if hasattr(self.mods, k):
                setattr(self.mods, k, getattr(self.mods, k) + float(dv))
        self.mods.clamp()
        # quiet log

    async def tonic_decay(self):
        while True:
            # Drift gently toward baseline
            baseline = Modulators()
            for k in baseline.__dict__.keys():
                cur = getattr(self.mods, k)
                tgt = getattr(baseline, k)
                setattr(self.mods, k, cur + 0.01*(tgt - cur))
            self.mods.clamp()
            await asyncio.sleep(0.2)


# -----------------------
# Simple STDP synapse (nociceptor -> motor/withdrawal)
# -----------------------

class STDP:
    def __init__(self):
        self.w = 1.0           # weight
        self.t_pre: Optional[float] = None
        self.t_post: Optional[float] = None
        self.tau_plus = 0.020  # 20 ms
        self.tau_minus = 0.020
        self.A_plus = 0.02
        self.A_minus = 0.025
        self.w_min = 0.1
        self.w_max = 3.0

    def pre_spike(self, t: float):
        self.t_pre = t
        if self.t_post is not None:
            dt = self.t_post - self.t_pre
            if 0 < dt < 0.1:  # post followed pre soon -> LTP
                dw = self.A_plus * math.exp(-dt / self.tau_plus)
                self.w = min(self.w_max, self.w + dw)

    def post_spike(self, t: float):
        self.t_post = t
        if self.t_pre is not None:
            dt = self.t_post - self.t_pre
            if -0.1 < dt < 0:  # post before pre -> LTD
                dw = -self.A_minus * math.exp(dt / self.tau_minus)
                self.w = max(self.w_min, self.w + dw)

    def renormalize(self):
        # Homeostatic touch
        self.w = min(max(self.w, self.w_min), self.w_max)

# -----------------------
# Reflex server (fast arc)
# -----------------------

class ReflexServer:
    """
    Monitors nociception and drives immediate withdrawal (bypassing high-level loops).
    """
    def __init__(self, bus: EventBus, stdp: STDP, mods: Modulators):
        self.bus = bus
        self.stdp = stdp
        self.mods = mods
        self.bus.subscribe("sensor/nociception", self.on_pain, sub_priority=100)  # high priority

    async def on_pain(self, e: Event):
        # Pre-synaptic spike for STDP
        self.stdp.pre_spike(e.ts)
        # Reflex amplitude scales with synaptic weight and arousal (norepinephrine)
        amp = 0.5 * self.stdp.w * (0.5 + self.mods.norepinephrine)
        cmd = {"type": "withdrawal", "amplitude": amp, "source": "reflex"}
        await self.bus.publish("motor/cmd", cmd, priority=90)
        # Pain raises arousal
        await self.bus.publish("modulator/nudge", {"norepinephrine": +0.2}, priority=5)
        # Strong negative reward: pain is aversive
        lvl = float(e.payload.get("level", 1.0))
        await self.bus.publish(
            "reward/signal",
            {"value": -0.3 * lvl, "novelty": 0.0, "action": "reflex_withdrawal"},
            priority=30,
        )

# -----------------------
# Basal ganglia (action selection gate)
# -----------------------

class BasalGanglia:
    """
    Arbitrates between candidate actions. Dopamine biases toward 'Go'.
    """
    def __init__(self, bus: EventBus, mods: Modulators):
        self.bus = bus
        self.mods = mods
        self.action_counts: Dict[str, int] = defaultdict(int)
        self.bus.subscribe("cortex/candidate_action", self.on_candidate, sub_priority=10)

    async def on_candidate(self, e: Event):
        val = float(e.payload.get("value", 0.0))
        # Dopamine raises the odds of gating a candidate action
        bias = (self.mods.dopamine - 0.5) * 1.0
        p_go = 1.0 / (1.0 + math.exp(-(val + bias)))
        if random.random() < p_go:
            # Gate this action to motor
            out = dict(e.payload)
            out["source"] = "basal_ganglia"
            await self.bus.publish("motor/cmd", out, priority=40)
            # Slight dopamine increase on go
            await self.bus.publish("modulator/nudge", {"dopamine": +0.02}, priority=2)
            action = out.get("type", "unknown")
            self.action_counts[action] += 1
            novelty = 1.0 / math.sqrt(self.action_counts[action])
            intrinsic = val
            await self.bus.publish(
                "reward/signal",
                {
                    "value": intrinsic,
                    "novelty": novelty,
                    "action": action,
                    "p_go": p_go,
                },
                priority=6,
            )
        else:
            # Slight dopamine decrease on no-go
            await self.bus.publish("modulator/nudge", {"dopamine": -0.01}, priority=2)
            await self.bus.publish(
                "reward/signal",
                {
                    "value": min(val, 0.0) - 0.05,
                    "novelty": 0.0,
                    "action": e.payload.get("type", "unknown"),
                    "p_go": p_go,
                    "reason": "no_go",
                },
                priority=4,
            )


class RewardLearner:
    """Integrates reward signals into neuromodulators and synaptic plasticity."""

    def __init__(self, bus: EventBus, mods: Modulators, stdp: STDP):
        self.bus = bus
        self.mods = mods
        self.stdp = stdp
        self.expected_reward = 0.0
        self.alpha = 0.1
        self.last_action: Optional[str] = None
        self.bus.subscribe("reward/signal", self.on_reward, sub_priority=5)

    async def on_reward(self, e: Event):
        reward = float(e.payload.get("value", 0.0))
        novelty = float(e.payload.get("novelty", 0.0))
        action = e.payload.get("action")
        if action and action != self.last_action:
            # Encourage trying new strategies
            novelty += 0.05
        total = reward + novelty
        self.expected_reward = (1 - self.alpha) * self.expected_reward + self.alpha * total
        advantage = total - self.expected_reward
        advantage = max(-1.0, min(1.0, advantage))

        updates: Dict[str, float] = {}
        if advantage >= 0:
            updates["dopamine"] = 0.12 * advantage
            updates["acetylcholine"] = 0.07 * advantage
        else:
            updates["dopamine"] = 0.08 * advantage
            updates["norepinephrine"] = -0.05 * advantage
            updates["serotonin"] = -0.03 * advantage

        await self.bus.publish("modulator/nudge", updates, priority=6)
        # Reinforce or depress the nociceptor synapse slightly based on reward
        self.stdp.w += 0.04 * advantage
        self.stdp.renormalize()

        self.last_action = action
        print(
            f"[Reward] action={action} total={total:.3f} target={self.expected_reward:.3f} adv={advantage:.3f}"
        )

# -----------------------
# Cerebellum (predictive correction)
# -----------------------

class Cerebellum:
    """
    Adds a quick feed-forward correction for stabilization; here a small PD-like tweak.
    """
    def __init__(self, bus: EventBus):
        self.bus = bus
        self.state = {"pos": 0.0, "vel": 0.0}
        self.bus.subscribe("motor/cmd", self.on_motor_cmd, sub_priority=0)

    async def on_motor_cmd(self, e: Event):
        cmd = dict(e.payload)
        if cmd.get("type") == "withdrawal":
            # Simple correction: temper extreme amplitudes
            amp = float(cmd.get("amplitude", 0.0))
            corrected = max(0.0, min(1.0, amp * 0.9))
            await self.bus.publish("motor/cmd_corrected",
                                   {"type": "withdrawal", "amplitude": corrected, "source": cmd.get("source")},
                                   priority=e.priority)
        else:
            # Pass non-reflex actions through untouched so downstream units and reward loops see them
            await self.bus.publish("motor/cmd_corrected", cmd, priority=e.priority)

# -----------------------
# Motor end-effector
# -----------------------

class MotorUnit:
    def __init__(self, bus: EventBus, stdp: STDP):
        self.bus = bus
        self.stdp = stdp
        self.bus.subscribe("motor/cmd_corrected", self.on_cmd, sub_priority=0)

    async def on_cmd(self, e: Event):
        cmd = e.payload
        # Post-synaptic spike for STDP (withdrawal considered the post spike)
        if cmd.get("type") == "withdrawal":
            self.stdp.post_spike(e.ts)
        # In a real system, this would actuate motors; we just print
        amp = cmd.get("amplitude")
        val = cmd.get("value")
        if amp is not None:
            print(
                f"[Motor] {cmd.get('type')} via {cmd.get('source')} amp={float(amp):.3f}   (w={self.stdp.w:.3f})"
            )
        elif val is not None:
            print(
                f"[Motor] {cmd.get('type')} via {cmd.get('source')} value={float(val):.3f}   (w={self.stdp.w:.3f})"
            )
        else:
            print(f"[Motor] {cmd.get('type')} via {cmd.get('source')}   (w={self.stdp.w:.3f})")

# -----------------------
# Sensors (nociceptor & "cortex")
# -----------------------

class Nociceptor:
    """
    Generates pain events when 'damage' is detected. Here, randomized spikes with bursts.
    """
    def __init__(self, bus: EventBus):
        self.bus = bus

    async def run(self):
        t = 0
        while True:
            # Low baseline probability; occasional bursts simulate real contact
            burst = (random.random() < 0.05)
            p = 0.02 + (0.25 if burst else 0.0)
            if random.random() < p:
                lvl = 0.6 + 0.4 * random.random()
                await self.bus.publish("sensor/nociception", {"level": lvl}, priority=80)
            await asyncio.sleep(0.01)  # 10ms tick

class CortexDummy:
    """
    Emits candidate actions (e.g., 'reach', 'hold') with random values to compete with reflexes.
    """
    def __init__(self, bus: EventBus):
        self.bus = bus

    async def run(self):
        actions = ["reach", "hold", "explore"]
        while True:
            act = random.choice(actions)
            val = random.uniform(-1.0, 1.0)
            await self.bus.publish("cortex/candidate_action",
                                   {"type": act, "value": val}, priority=10)
            await asyncio.sleep(0.05)

# -----------------------
# Sleep / maintenance (homeostasis)
# -----------------------

class Maintenance:
    def __init__(self, stdp: STDP, mods: Modulators):
        self.stdp = stdp
        self.mods = mods

    async def nightly(self):
        while True:
            await asyncio.sleep(5.0)  # maintenance cycle period
            # Renormalize synapse & gently restore modulators toward baseline
            self.stdp.renormalize()
            baseline = Modulators()
            for k in baseline.__dict__.keys():
                cur = getattr(self.mods, k)
                tgt = getattr(baseline, k)
                setattr(self.mods, k, cur + 0.2*(tgt - cur))
            self.mods.clamp()
            print(f"[Sleep] maintenance done -> w={self.stdp.w:.3f}, mods={self.mods}")

# -----------------------
# Wiring it up
# -----------------------

async def main(runtime_sec: float = 8.0):
    bus = EventBus()
    mods = Modulators()
    stdp = STDP()

    thal = ThalamusBroker(bus)
    mods_center = ModulatorCenter(bus, mods)
    reflex = ReflexServer(bus, stdp, mods)
    bg = BasalGanglia(bus, mods)
    reward = RewardLearner(bus, mods, stdp)
    cereb = Cerebellum(bus)
    motor = MotorUnit(bus, stdp)
    pain = Nociceptor(bus)
    cx = CortexDummy(bus)
    maint = Maintenance(stdp, mods)

    # Wire final stage (cerebellum -> motor)
    # Already done via topics: motor/cmd -> motor/cmd_corrected

    # Start tasks
    tasks = [
        asyncio.create_task(thal.run()),
        asyncio.create_task(mods_center.tonic_decay()),
        asyncio.create_task(pain.run()),
        asyncio.create_task(cx.run()),
        asyncio.create_task(maint.nightly()),
    ]

    # Tee motor/cmd through cerebellum correction
    # (Cerebellum subscribes to motor/cmd and emits motor/cmd_corrected)
    # Motor subscribes to motor/cmd_corrected

    # Run for a while then stop
    try:
        await asyncio.sleep(runtime_sec)
    finally:
        for t in tasks:
            t.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        print("[System] shutdown")

if __name__ == "__main__":
    asyncio.run(main())
