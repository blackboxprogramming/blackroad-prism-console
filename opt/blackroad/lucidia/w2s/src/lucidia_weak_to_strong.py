import os, json, math, argparse, random, time
from pathlib import Path
from typing import List, Dict, Any

import torch
from datasets import load_dataset
from transformers import (AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments,
                          DataCollatorForLanguageModeling)
from peft import LoraConfig, get_peft_model, PeftModel

def log(path, obj):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")

def read_jsonl(path):
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                yield json.loads(line)

def build_tokenizer(model_id):
    tok = AutoTokenizer.from_pretrained(model_id, use_fast=True)
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token
    return tok

@torch.inference_mode()
def generate_and_confidence(model, tok, prompts, max_new_tokens=128, device="cpu"):
    model.eval()
    confs, outs = [], []
    for p in prompts:
        inputs = tok(p, return_tensors="pt").to(device)
        gen_ids = model.generate(**inputs, max_new_tokens=max_new_tokens, do_sample=False)
        gen_text = tok.decode(gen_ids[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True).strip()

        # crude pseudo-confidence: exp(-NLL per token) on the generated continuation
        tgt_ids = tok(gen_text, return_tensors="pt", add_special_tokens=False).input_ids.to(device)
        if tgt_ids.numel() == 0:
            conf = 0.0
        else:
            labels = tgt_ids.clone()
            out = model(input_ids=tgt_ids, labels=labels)
            nll = out.loss.item()
            conf = math.exp(-nll)  # in (0,1]; higher is "more confident"
        outs.append(gen_text)
        confs.append(conf)
    return outs, confs

def stitch_io(tokenizer, prompt, target, ctx_len):
    prefix = f"Instruction:\n{prompt}\n\nAssistant:\n"
    x = tokenizer(prefix, truncation=True, max_length=ctx_len, add_special_tokens=False)
    y = tokenizer(target + tokenizer.eos_token, truncation=True, max_length=ctx_len, add_special_tokens=False)
    input_ids = x.input_ids + y.input_ids
    labels = [-100]*len(x.input_ids) + y.input_ids
    return {"input_ids": input_ids[:ctx_len], "labels": labels[:ctx_len]}

class SimpleDataset(torch.utils.data.Dataset):
    def __init__(self, rows): self.rows = rows
    def __len__(self): return len(self.rows)
    def __getitem__(self, i): return self.rows[i]

def make_lora(model):
    cfg = LoraConfig(
        r=16, lora_alpha=32, lora_dropout=0.05, bias="none",
        target_modules=["query_key_value","dense","dense_h_to_4h","dense_4h_to_h"]
    )
    return get_peft_model(model, cfg)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--weak_model_id", type=str, default="")
    ap.add_argument("--strong_model_id", type=str, required=True)
    ap.add_argument("--dataset_path", type=str, default="")
    ap.add_argument("--output_dir", type=str, required=True)
    ap.add_argument("--context_len", type=int, default=512)
    ap.add_argument("--max_new_tokens", type=int, default=128)
    ap.add_argument("--train_batch_size", type=int, default=8)
    ap.add_argument("--epochs", type=int, default=2)
    ap.add_argument("--learning_rate", type=str, default="2e-4")
    ap.add_argument("--confidence_threshold", type=float, default=0.25)
    ap.add_argument("--mix_ground_truth_ratio", type=float, default=0.0)
    ap.add_argument("--load_in_8bit", action="store_true")
    ap.add_argument("--use_lora", action="store_true")
    ap.add_argument("--merge_lora", action="store_true")
    ap.add_argument("--merged_model_out", type=str, default="")
    args = ap.parse_args()

    device = "cuda" if torch.cuda.is_available() else "cpu"
    os.makedirs(args.output_dir, exist_ok=True)

    # === (A) MERGE-ONLY MODE ===
    if args.merge_lora:
        assert args.merged_model_out, "Provide --merged_model_out"
        base = AutoModelForCausalLM.from_pretrained(args.strong_model_id, torch_dtype=torch.float16 if device=="cuda" else torch.float32, device_map="auto" if device=="cuda" else None)
        peft = PeftModel.from_pretrained(base, os.path.join(args.output_dir, "lora"))
        merged = peft.merge_and_unload()
        tok = build_tokenizer(args.strong_model_id)
        Path(args.merged_model_out).mkdir(parents=True, exist_ok=True)
        merged.save_pretrained(args.merged_model_out)
        tok.save_pretrained(args.merged_model_out)
        print(f"Merged model saved to {args.merged_model_out}")
        return

    # === (B) FULL PIPELINE ===
    assert args.dataset_path, "dataset required"
    raw = list(read_jsonl(args.dataset_path))
    prompts = [r["prompt"] for r in raw]

    # Weak labeling (skip if user passed no weak model)
    weak_labels = []
    if args.weak_model_id:
        weak_tok = build_tokenizer(args.weak_model_id)
        wi_kwargs = {}
        if args.load_in_8bit and device == "cuda":
            wi_kwargs.update(dict(load_in_8bit=True, device_map="auto"))
        weak = AutoModelForCausalLM.from_pretrained(args.weak_model_id, **wi_kwargs)
        weak.to(device)
        outs, confs = generate_and_confidence(weak, weak_tok, prompts, args.max_new_tokens, device)
        for r, y, c in zip(raw, outs, confs):
            weak_labels.append({**r, "weak": y, "conf": c})
        # log weak outputs for Codex/Guardian
        for item in weak_labels:
            log(os.path.join(args.output_dir, "weak_labels.jsonl"), item)
    else:
        # If no weak, treat provided "response" as the only supervision (degenerates to SFT)
        for r in raw:
            weak_labels.append({**r, "weak": r.get("response",""), "conf": 1.0})

    # Build training rows (filter low-confidence; optionally mix some GT)
    train_rows = []
    for r in weak_labels:
        use_gt = ("response" in r and r["response"]) and (random.random() < args.mix_ground_truth_ratio)
        target = r["response"] if use_gt else r["weak"]
        if not target:
            continue
        if not use_gt and r.get("conf",0.0) < args.confidence_threshold:
            continue
        train_rows.append({"prompt": r["prompt"], "target": target, "conf": r.get("conf",1.0), "used_gt": use_gt})

    # Tokenize
    tok = build_tokenizer(args.strong_model_id)
    def encode(row): return stitch_io(tok, row["prompt"], row["target"], args.context_len)
    enc = [encode(r) for r in train_rows]
    ds = SimpleDataset(enc)

    # Strong model
    si_kwargs = {}
    if args.load_in_8bit and device == "cuda":
        si_kwargs.update(dict(load_in_8bit=True, device_map="auto"))
    strong = AutoModelForCausalLM.from_pretrained(args.strong_model_id, **si_kwargs)
    if args.use_lora:
        strong = make_lora(strong)
    strong.resize_token_embeddings(len(tok))

    # Trainer
    collator = DataCollatorForLanguageModeling(tok, mlm=False)
    targs = TrainingArguments(
        output_dir=os.path.join(args.output_dir, "hf"),
        per_device_train_batch_size=args.train_batch_size,
        learning_rate=float(args.learning_rate),
        num_train_epochs=args.epochs,
        gradient_accumulation_steps=1,
        logging_steps=10,
        save_steps=200,
        save_total_limit=2,
        bf16=(device=="cuda" and torch.cuda.get_device_capability()[0] >= 8),
        fp16=(device=="cuda" and torch.cuda.get_device_capability()[0] < 8),
        report_to=[],
    )
    trainer = Trainer(model=strong, args=targs, train_dataset=ds, tokenizer=tok, data_collator=collator)
    trainer.train()

    # Save LoRA adapter (if used) or full model
    if args.use_lora:
        lora_dir = os.path.join(args.output_dir, "lora")
        Path(lora_dir).mkdir(parents=True, exist_ok=True)
        strong.save_pretrained(lora_dir)
        tok.save_pretrained(lora_dir)
    else:
        full_dir = os.path.join(args.output_dir, "full")
        Path(full_dir).mkdir(parents=True, exist_ok=True)
        strong.save_pretrained(full_dir)
        tok.save_pretrained(full_dir)

    # Quick audit: run strong on all prompts; log contradictions vs. high-conf weak
    strong.eval()
    device_map = "auto" if device=="cuda" else None
    from tqdm import tqdm
    contradictions = 0
    for item in tqdm(weak_labels, desc="Auditing strong vs weak"):
        p = item["prompt"]
        w, c = item.get("weak",""), item.get("conf", 0.0)
        if not w: continue
        inp = tok(p, return_tensors="pt").to(device)
        gen = strong.generate(**inp, max_new_tokens=args.max_new_tokens, do_sample=False)
        s_out = tok.decode(gen[0][inp["input_ids"].shape[1]:], skip_special_tokens=True).strip()
        disagree = (c >= max(args.confidence_threshold, 0.5)) and (s_out[:64].strip() != w[:64].strip())
        if disagree:
            contradictions += 1
            log(os.path.join(args.output_dir, "contradiction_log.jsonl"), {
                "t": int(time.time()),
                "prompt": p, "weak": w, "strong": s_out, "weak_conf": c,
                "sigil": "Ψ′_contradiction"
            })
        log(os.path.join(args.output_dir, "codex_output.jsonl"), {
            "t": int(time.time()),
            "prompt": p, "strong": s_out, "weak": w, "weak_conf": c
        })

    summary = {
        "samples": len(prompts),
        "train_used": len(train_rows),
        "contradictions": contradictions,
        "output_dir": args.output_dir,
        "weak_model": args.weak_model_id or "N/A",
        "strong_model": args.strong_model_id,
        "use_lora": bool(args.use_lora),
        "device": device
    }
    print(json.dumps(summary, indent=2))
    log(os.path.join(args.output_dir, "summary.jsonl"), summary)

if __name__ == "__main__":
    main()
