# Prereqs: JetPack, TensorRT-LLM wheel installed (aarch64), and polygraphy if needed
set -euo pipefail

MODEL_DIR=models/merged/lucidia-neox-1.4b
ENGINE_DIR=models/merged/trt
SEQ=2048
mkdir -p "$ENGINE_DIR"

# (1) Convert HF -> TRT-LLM checkpoint format (NeoX config)
python3 -m tensorrt_llm.tools.convert_checkpoint --model_dir $MODEL_DIR --dtype float16 --output_dir $ENGINE_DIR/ckpt --model_type gptneox

# (2) Build engine (FP16; add --int8 if you’ve calibrated/quantized)
python3 -m tensorrt_llm.runtime.build --checkpoint_dir $ENGINE_DIR/ckpt --engine_dir $ENGINE_DIR/engine --gpt_neox --logits_dtype float16 --max_seq_len $SEQ

echo "Engine at $ENGINE_DIR/engine"
