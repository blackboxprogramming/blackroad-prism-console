from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import onnxruntime as ort
import numpy as np
from transformers import AutoTokenizer

MODEL_DIR = "models/merged/lucidia-neox-1.4b"
ONNX_PATH = "models/merged/onnx/model.onnx"

tok = AutoTokenizer.from_pretrained(MODEL_DIR, use_fast=True)
providers = ["CUDAExecutionProvider","CPUExecutionProvider"]
sess = ort.InferenceSession(ONNX_PATH, providers=providers)

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: Optional[str] = "lucidia-core-neox"
    messages: List[Message]
    max_tokens: int = 256
    temperature: float = 0.7
    top_p: float = 0.9

class Choice(BaseModel):
    index: int
    message: Message
    finish_reason: str = "stop"

class ChatResponse(BaseModel):
    id: str = "chatcmpl-lucidia"
    object: str = "chat.completion"
    choices: List[Choice]

app = FastAPI(title="Lucidia-Core (NeoX)")

def sample_top_p(logits, top_p=0.9, temperature=0.7):
    logits = logits / max(1e-6, temperature)
    probs = np.exp(logits - logits.max())
    probs = probs / probs.sum()
    sorted_idx = np.argsort(-probs)
    cum = np.cumsum(probs[sorted_idx])
    cutoff = sorted_idx[cum <= top_p]
    if cutoff.size == 0:
        cutoff = sorted_idx[:1]
    probs_cut = probs[cutoff]
    probs_cut = probs_cut / probs_cut.sum()
    return np.random.choice(cutoff, p=probs_cut)

@app.post("/v1/chat/completions")
def chat(req: ChatRequest):
    # Simple prompt glue (system + user last)
    system = ""
    for m in req.messages:
        if m.role == "system": system = m.content
    user = req.messages[-1].content
    prompt = ((system + "\n") if system else "") + user

    ids = tok(prompt, return_tensors="np")
    input_ids = ids["input_ids"]
    attention_mask = ids["attention_mask"]
    generated = input_ids.tolist()[0]

    for _ in range(req.max_tokens):
        outs = sess.run(["logits"], {"input_ids": input_ids, "attention_mask": attention_mask})[0]
        last = outs[0, -1, :]  # (batch=1, seq, vocab)
        next_id = int(sample_top_p(last, req.top_p, req.temperature))
        generated.append(next_id)
        input_ids = np.array([generated], dtype=np.int64)
        attention_mask = np.ones_like(input_ids, dtype=np.int64)
        if next_id == tok.eos_token_id:
            break

    text = tok.decode(generated[len(ids["input_ids"][0]):], skip_special_tokens=True)
    return ChatResponse(choices=[Choice(index=0, message=Message(role="assistant", content=text))])
