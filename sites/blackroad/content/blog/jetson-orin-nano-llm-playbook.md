---
title: "Jetson Orin Nano LLM Playbook"
date: "2025-02-14"
tags: [jetson, llm, edge-ai]
description: "Step-by-step guide for running 3–7B GGUF models on a Jetson Orin Nano with llama.cpp, GPU offload, and systemd service management."
---

Running a local large language model on NVIDIA's Jetson Orin Nano does not require container stacks or heavyweight orchestration. The recipe below focuses on the practical steps for reliably serving quantized 3–7B GGUF models with `llama.cpp`, using the Nano's GPU where it helps and keeping memory pressure predictable.

## 1. Prepare swap and system packages

Configuring compressed swap avoids out-of-memory errors when models briefly spike RAM usage during load. The snippet sets up zram for fast compressed swap in RAM and adds an optional file-backed swapfile for extra headroom.

```bash
sudo apt update
sudo apt install -y zram-tools cmake build-essential git wget

echo "ALGO=lz4
PERCENT=0
PRIORITY=100
ZRAM_NUM_DEVICES=1
ZRAM_DEVICE_SIZE=8192" | sudo tee /etc/default/zramswap >/dev/null

sudo systemctl enable --now zramswap.service

sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab
sudo swapon -a
```

Set `ZRAM_DEVICE_SIZE` to 8192 for an 8 GiB zram device, or higher if you want 16 GiB on models that stretch memory limits.

## 2. Build `llama.cpp` with CUDA acceleration

Cloning and compiling `llama.cpp` locally keeps the toolchain lean while enabling GPU offload via cuBLAS.

```bash
cd ~
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
mkdir -p build && cd build
cmake .. -DLLAMA_CUBLAS=ON
make -j$(nproc)
```

The `-DLLAMA_CUBLAS=ON` flag is important on Jetson since it unlocks CUDA paths for layer offloading. Avoid Docker here—the container overhead eats into the limited RAM/VRAM budget.

## 3. Download or convert a GGUF model

Create a models folder (for example `~/models`) and place a GGUF file inside. Solid starters for the Nano include:

- **Phi-3-mini (3–4B)** in `q4_k_m` or `q5_k_m` for snappy interactions on minimal VRAM.
- **Mistral-7B-Instruct (q4_k_m)** for better reasoning while remaining workable with swap enabled.
- **Llama-3.1-8B Instruct** quantized down to roughly the 7B footprint (`q4_k_m`) when you need longer context windows.

You can download pre-quantized GGUF models or convert using the upstream scripts bundled with `llama.cpp`.

## 4. Launch the inference server

Tune the GPU offload count (`-ngl`) for your VRAM budget. Start conservative and raise it until you see VRAM limits being hit.

```bash
~/llama.cpp/build/bin/llama-server \
  -m ~/models/your-model.gguf \
  -c 2048 \
  -ngl 20 \
  -a 127.0.0.1 -p 8080
```

Handy tweaks:

- Increase `-ngl` incrementally for more GPU acceleration, reducing if you encounter CUDA OOM events.
- Add `-t $(nproc)` when you are CPU-bound to saturate the Nano's cores.
- Keep contexts between 2k and 3k tokens for 7B-class models unless you accept higher latency.

## 5. Run `llama.cpp` as a service

A systemd unit keeps the server alive across reboots and automatically restarts it when something crashes.

```bash
cat <<'UNIT' | sudo tee /etc/systemd/system/llama.service >/dev/null
[Unit]
Description=llama.cpp server
After=network-online.target
Wants=network-online.target
ConditionPathExists=%h/llama.cpp/build/bin/llama-server
ConditionPathExists=%h/models/your-model.gguf

[Service]
User=ubuntu
WorkingDirectory=%h/llama.cpp/build
ExecStart=%h/llama.cpp/build/bin/llama-server -m %h/models/your-model.gguf -c 2048 -ngl 20 -a 127.0.0.1 -p 8080
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable --now llama
```

Change `User=ubuntu` and the `ExecStart` path if your deployment uses a different account or model path.

## 6. Test the endpoint

`llama-server` exposes an OpenAI-compatible API. Use `curl` to validate that responses stream correctly before wiring it into applications.

```bash
curl -s http://127.0.0.1:8080/v1/chat/completions \
 -H "Content-Type: application/json" \
 -d '{
   "model": "local",
   "messages":[{"role":"user","content":"Give me a 2-sentence summary of the Jetson Orin Nano."}]
 }' | jq '.choices[0].message.content'
```

## 7. Quick performance wins

- **Skip Docker for serving.** Extra namespaces and cgroups reduce available RAM and complicate GPU access.
- **Quantization matters.** `q4_k_m` offers a good speed/quality balance on 7B models; switch to `q5` if VRAM allows.
- **Prompt engineering beats parameters.** A solid system prompt can boost small-model quality more than jumping to a larger checkpoint.
- **Manage thermals.** Ensure active cooling so the Nano does not throttle during long inference sessions.

## 8. Troubleshooting checklist

- **OOM while loading?** Reduce `-ngl`, switch to a smaller quant, add swap, or shorten context windows.
- **Slow first token?** Keep the server running to avoid reinitialization overhead.
- **CUDA mismatches?** Ensure your JetPack release aligns with the CUDA libraries used during the `llama.cpp` build.

Have a specific model or RAM footprint in mind? Tweak the unit file parameters and swap sizing above, and you will have a tuned, always-on local assistant within minutes.
