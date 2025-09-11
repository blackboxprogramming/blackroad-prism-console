# Lucidia × MPE (OpenAI-free)

## Install
```bash
pip install numpy
pip install mpe2 || pip install "pettingzoo[mpe]"

Quick run

python /opt/blackroad/lucidia/agents/mpe/runner.py --scenario simple_tag --episodes 3 --seed 7 --render off

Prints a JSON summary and writes JSONL steps to /var/log/blackroad/mpe/.

Chat mode

python /opt/blackroad/lucidia/agents/mpe/chat_adapter.py
# then type:
scenarios
start scenario=simple_spread episodes=2 seed=11 render=off

Codex Infinity

Load /opt/blackroad/codex/prompts/mpe_orchestrator.prompt and let the engine
emit control lines like [MPE start scenario=... ...] and parse the JSON reply.

Notes
•MPE lives in MPE2 (new package); PettingZoo MPE is being moved. Prefer mpe2 imports.
•Legacy OpenAI MPE is archived; no dependency on it.

---

### Why this wiring (and why now)

- **MPE2 is the new home**: PettingZoo warns MPE v3 envs are moving; this setup prefers `mpe2.*_v3` and only falls back to `pettingzoo.mpe` if needed.  [oai_citation:6‡pettingzoo.farama.org](https://pettingzoo.farama.org/environments/mpe/simple_tag/?utm_source=chatgpt.com) [oai_citation:7‡mpe2.farama.org](https://mpe2.farama.org/?utm_source=chatgpt.com)
- **API-compatible loop**: we use PettingZoo/MPE2’s `agent_iter()` pattern correctly for deterministic stepping.  [oai_citation:8‡pettingzoo.farama.org](https://pettingzoo.farama.org/content/basic_usage/?utm_source=chatgpt.com)
- **OpenAI-free**: no calls to OpenAI APIs; legacy OpenAI MPE repo acknowledged but unused.  [oai_citation:9‡GitHub](https://github.com/openai/multiagent-particle-envs?utm_source=chatgpt.com)

---

### Next knobs (optional)
- Add an `independent PPO` policy if you want learning (SB3 via Gymnasium wrappers).
- Expose the chat adapter over FastAPI for web UI on blackroad.io’s dashboard.
- Wire contradictions to your Ψ′ log by reading `/var/log/blackroad/mpe/*.jsonl` and computing deltas between tags.

If you want the FastAPI microservice or a lean PPO policy added, say the word and I’ll drop two more nano-ready files.

_Last updated on 2025-09-11_
