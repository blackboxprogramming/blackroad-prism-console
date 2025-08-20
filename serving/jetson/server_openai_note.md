# Jetson Orin TensorRT-LLM Serving

1. **Install dependencies** (see `tools/lucidia_orin_trt_install.sh`).
2. **Run server**:
   ```bash
   trtllm-serve <MODEL_PATH> --port 8000 --host 0.0.0.0
   ```
   - `<MODEL_PATH>` can point to a merged HF model dir or an AWQ directory.
   - Use `--max-tokens $MAX_TOKENS` to manage VRAM. A helper function in the
     code base estimates KV cache usage.
3. **Environment variables**:
   - `OPENAI_BASE_URL` – default `http://<ORIN_IP>:8000/v1`
   - `OPENAI_MODEL` – model name exposed by the server
   - `RAG_INDEX_PATH` – path to FAISS index for retrieval
4. The endpoint is compatible with the OpenAI `/v1/chat/completions` API.
   Example curl:
   ```bash
   curl http://<ORIN_IP>:8000/v1/chat/completions \
        -H 'Content-Type: application/json' \
        -d '{"model":"$OPENAI_MODEL","messages":[{"role":"user","content":"hi"}]}'
   ```
