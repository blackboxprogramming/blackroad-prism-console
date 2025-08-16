import argparse, torch, os
from transformers import AutoModelForCausalLM, AutoTokenizer

parser = argparse.ArgumentParser()
parser.add_argument("--model", default="models/merged/lucidia-neox-1.4b")
parser.add_argument("--out", default="models/merged/onnx")
parser.add_argument("--seq", type=int, default=2048)
args = parser.parse_args()
os.makedirs(args.out, exist_ok=True)

tok = AutoTokenizer.from_pretrained(args.model, use_fast=True)
model = AutoModelForCausalLM.from_pretrained(args.model, torch_dtype=torch.float16).eval()

dummy = tok("Hello Lucidia", return_tensors="pt")
dummy = {k: v for k, v in dummy.items()}

torch.onnx.export(
    model, (dummy["input_ids"], dummy["attention_mask"]),
    f"{args.out}/model.onnx",
    input_names=["input_ids","attention_mask"],
    output_names=["logits"],
    dynamic_axes={"input_ids":{0:"batch",1:"seq"}, "attention_mask":{0:"batch",1:"seq"}, "logits":{0:"batch",1:"seq"}},
    opset_version=17
)
print("Exported ONNX to", args.out)
