# Prosody Sidecar

FastAPI microservice that converts raw text or token lists into SSML prosody
controls. It distributes an emphasis budget over syllables to provide
word-level pacing, emphasis, and pitch adjustments for the conductor.

## Usage

```bash
cd services/prosody-sidecar
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn sidecar:app --reload --port 8000
```

Send a request:

```bash
curl -X POST http://localhost:8000/plan \
  -H "Content-Type: application/json" \
  -d '{"text":"We really need this to land clearly.","emph_budget":0.35}'
```

Response contains an SSML string plus the per-word pacing plan that can be fed
into the conductor.
