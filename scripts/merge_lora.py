import argparse, torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

parser = argparse.ArgumentParser()
parser.add_argument("--base", default="EleutherAI/pythia-1.4b")
parser.add_argument("--adapter", default="outputs/lucidia-core-lora")
parser.add_argument("--out", default="models/merged/lucidia-neox-1.4b")
args = parser.parse_args()

tok = AutoTokenizer.from_pretrained(args.base, use_fast=True)
base = AutoModelForCausalLM.from_pretrained(args.base, torch_dtype=torch.bfloat16)
merged = PeftModel.from_pretrained(base, args.adapter)
merged = merged.merge_and_unload()

tok.save_pretrained(args.out)
merged.save_pretrained(args.out)
print(f"Merged model saved to {args.out}")
