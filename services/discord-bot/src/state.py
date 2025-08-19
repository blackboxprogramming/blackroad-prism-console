from __future__ import annotations
from collections import deque
from typing import Deque, Dict, List

class ThreadState:
    def __init__(self, max_messages: int = 24):
        self.history: Deque[Dict] = deque(maxlen=max_messages)
        self.count: int = 0

    def add(self, role: str, content: str):
        self.history.append({"role": role, "content": content})
        self.count += 1

class Memory:
    def __init__(self, max_messages: int):
        self.max_messages = max_messages
        self.threads: Dict[int, ThreadState] = {}

    def get(self, thread_id: int) -> ThreadState:
        if thread_id not in self.threads:
            self.threads[thread_id] = ThreadState(self.max_messages)
        return self.threads[thread_id]

    def total_count(self, thread_id: int) -> int:
        return self.get(thread_id).count
