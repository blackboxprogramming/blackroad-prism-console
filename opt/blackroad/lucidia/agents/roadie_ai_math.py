#!/usr/bin/env python3
"""
Roadie AI Math Agent (BlackRoad/Lucidia)
- Pure Python stdlib. Optional local LLM via Ollama (http://localhost:11434).
- Reads curriculum: /opt/blackroad/lucidia/curricula/ai_math_roadmap.json
- Tracks progress in: /var/lib/lucidia/ai_math_progress.json
- Exports Anki TSV to: /var/lib/lucidia/ai_math_anki.tsv
- Style: machine-first with light chit-chat.
"""
import os, sys, json, time, random, pathlib, textwrap, datetime, re
from urllib import request as urlrequest
from urllib.error import URLError, HTTPError

ROOT_CURR = "/opt/blackroad/lucidia/curricula/ai_math_roadmap.json"
STATE_DIR = "/var/lib/lucidia"
STATE_FILE = f"{STATE_DIR}/ai_math_progress.json"
ANKI_FILE  = f"{STATE_DIR}/ai_math_anki.tsv"

OLLAMA_URL   = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "phi4")  # pick any local model you have

def ensure_dirs():
    pathlib.Path(STATE_DIR).mkdir(parents=True, exist_ok=True)

def load_curriculum():
    with open(ROOT_CURR, "r", encoding="utf-8") as f:
        return json.load(f)

def load_state():
    if not os.path.exists(STATE_FILE):
        return {"created_at": time.time(), "history": [], "leitner": {}, "due": []}
    with open(STATE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_state(s):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(s, f, indent=2)

def _ollama_generate(prompt: str) -> str:
    """Call local Ollama generate endpoint; return full text. No streaming."""
    data = json.dumps({"model": OLLAMA_MODEL, "prompt": prompt}).encode("utf-8")
    req = urlrequest.Request(f"{OLLAMA_URL}/api/generate", data=data, headers={"Content-Type":"application/json"})
    try:
        with urlrequest.urlopen(req, timeout=60) as resp:
            # Ollama returns line-delimited JSON events; collect 'response' fields
            chunks = []
            for line in resp.read().splitlines():
                try:
                    obj = json.loads(line)
                    if "response" in obj:
                        chunks.append(obj["response"])
                except Exception:
                    continue
            return "".join(chunks).strip()
    except (URLError, HTTPError) as e:
        return ""

def _now_date():
    return datetime.date.today().isoformat()

def leitner_next_bin(cur_bin: int, quality: int) -> int:
    """Leitner progression: quality 0-2 → stay/go back; 3-4 → +1 bin; 5 → +2 bins."""
    if quality <= 2: return max(1, cur_bin - (1 if quality == 0 else 0))
    return cur_bin + (2 if quality == 5 else 1)

def due_in_days(bin_no: int) -> int:
    return {1: 0, 2: 1, 3: 3, 4: 7, 5: 14, 6: 30}.get(bin_no, 30)

def make_card_key(block_id, unit_id):
    return f"{block_id}/{unit_id}"

def seed_cards(curr):
    cards = []
    for b in curr["blocks"]:
        for u in b["units"]:
            cards.append({
                "key": make_card_key(b["id"], u["id"]),
                "block": b["title"],
                "unit": u["concept"],
                "bin": 1,
                "last": None,
                "due": _now_date()
            })
    return cards

def sync_cards(state, curr):
    existing = {h["key"]: h for h in state.get("leitner", {}).values()} if state.get("leitner") else {}
    if not existing:
        cards = seed_cards(curr)
        state["leitner"] = {c["key"]: c for c in cards}
        return
    # Add any new units
    for b in curr["blocks"]:
        for u in b["units"]:
            k = make_card_key(b["id"], u["id"])
            if k not in state["leitner"]:
                state["leitner"][k] = {"key":k,"block":b["title"],"unit":u["concept"],"bin":1,"last":None,"due":_now_date()}

def simple_bank_qas(unit):
    concept = unit["concept"]
    checks = unit.get("check", [])
    tasks  = unit.get("tasks", [])
    qs = []
    for c in checks:
        qs.append((f"[CHECK] {concept}: {c}", "Proof/derivation; verify conditions."))
    for t in tasks:
        qs.append((f"[TASK] {concept}: {t}", "Worked solution with steps."))
    if not qs:
        qs = [(f"Explain {concept} with an example and edge case.", "Clear, minimal derivation.")]
    return qs

MACHINE_FRAME = """<<machine-header>>
id: {key}
block: {block}
unit: {unit}
date: {date}
mode: machine_chit_chat
difficulty: {difficulty}
</machine-header>

<instruction>
Generate ONE rigorous question for the concept above. Prefer:
- formal statement,
- tiny numeric example (if appropriate),
- and a single result to check.
Output sections in this order:
1) Q:
2) Hint:
3) Expected-Form:
Keep it terse, symbolic, correct.
</instruction>
"""

def generate_question_with_llm(card, curriculum) -> dict:
    # pick the matching unit
    unit = None
    for b in curriculum["blocks"]:
        for u in b["units"]:
            if make_card_key(b["id"], u["id"]) == card["key"]:
                unit = u; break
        if unit: break
    if not unit:
        return {}

    difficulty = random.choice(curriculum["style"]["difficulty_scale"])
    prompt = MACHINE_FRAME.format(
        key=card["key"], block=card["block"], unit=unit["concept"],
        date=_now_date(), difficulty=difficulty
    )
    txt = _ollama_generate(prompt)
    if not txt:  # fallback to bank
        q, a = random.choice(simple_bank_qas(unit))
        return {"q": q, "hint": "Recall definitions & properties.", "expect": "Proof or numeric check.", "gold": a}
    # crude parse
    q = re.search(r"Q:\s*(.*)", txt, re.S)
    h = re.search(r"Hint:\s*(.*)", txt, re.S)
    e = re.search(r"Expected[-–]Form:\s*(.*)", txt, re.S)
    return {
        "q": (q.group(1).strip() if q else txt.strip()),
        "hint": (h.group(1).strip() if h else ""),
        "expect": (e.group(1).strip() if e else "")
    }

def grade_answer_with_llm(question, user_answer) -> dict:
    rubric = f"""Grade the student's answer on a 0-5 scale.
Q: {question}
A: {user_answer}
Return only JSON: {{"score": <0-5>, "notes": "<concise reason>"}}"""
    txt = _ollama_generate(rubric)
    try:
        m = re.search(r"\{.*\}", txt, re.S)
        return json.loads(m.group(0)) if m else {"score": 3, "notes": "Default pass"}
    except Exception:
        return {"score": 3, "notes": "Heuristic"}

def update_card(card, quality):
    card["bin"] = max(1, min(6, leitner_next_bin(card["bin"], quality)))
    card["last"] = _now_date()
    next_days = due_in_days(card["bin"])
    card["due"] = (datetime.date.today() + datetime.timedelta(days=next_days)).isoformat()

def pick_due_cards(state, n=5):
    today = _now_date()
    due = [c for c in state["leitner"].values() if c["due"] <= today]
    if not due:
        # surface the earliest upcoming if nothing due
        allc = list(state["leitner"].values())
        allc.sort(key=lambda x: x["due"])
        return allc[:n]
    random.shuffle(due)
    return due[:n]

def fmt_machine(msg):
    return textwrap.indent(msg.strip(), prefix="| ")

def run_session(n=5):
    ensure_dirs()
    curr = load_curriculum()
    state = load_state()
    sync_cards(state, curr)
    cards = pick_due_cards(state, n=n)

    print(fmt_machine("chit chat cadillac: Roadie Math online."))
    for i, card in enumerate(cards, 1):
        pack = generate_question_with_llm(card, curr)
        if not pack:
            print(fmt_machine(f"[{i}] Unable to generate; skipping."))
            continue
        print("")
        print(fmt_machine(f"[{i}] {card['block']} › {card['unit']}  (bin {card['bin']})"))
        print(fmt_machine(f"Q: {pack['q']}"))
        if pack.get("hint"): print(fmt_machine(f"Hint: {pack['hint']}"))
        print(fmt_machine("Your answer:"))
        try:
            ans = input("> ").strip()
        except KeyboardInterrupt:
            print("\n" + fmt_machine("Session interrupted.")); break

        grade = {"score": 3, "notes": "manual"}
        if _ollama_generate("ping"):  # cheap availability check
            grade = grade_answer_with_llm(pack['q'], ans)

        q = max(0, min(5, int(grade.get("score", 3))))
        update_card(card, q)
        state["history"].append({
            "t": time.time(), "key": card["key"], "q": pack["q"], "a": ans,
            "score": q, "notes": grade.get("notes","")
        })
        print(fmt_machine(f"Score: {q}  Notes: {grade.get('notes','')}"))
        print(fmt_machine(f"Next due: {card['due']}  Truth: {'✓' if q>=4 else ('0' if q==3 else '–1')}"))

    save_state(state)
    print("")
    print(fmt_machine("Session complete. Persisted memory + schedule."))

def status():
    ensure_dirs()
    state = load_state()
    cards = list(state.get("leitner", {}).values())
    by_bin = {}
    for c in cards:
        by_bin[c["bin"]] = by_bin.get(c["bin"], 0) + 1
    print(fmt_machine(f"Cards: {len(cards)}"))
    for b in sorted(by_bin):
        print(fmt_machine(f"  Bin {b}: {by_bin[b]}"))
    due = [c for c in cards if c["due"] <= _now_date()]
    print(fmt_machine(f"Due today: {len(due)}"))

def export_anki():
    ensure_dirs()
    state = load_state()
    curr = load_curriculum()
    units = {}
    for b in curr["blocks"]:
        for u in b["units"]:
            units[make_card_key(b["id"], u["id"])] = u
    with open(ANKI_FILE, "w", encoding="utf-8") as f:
        for k, card in state.get("leitner", {}).items():
            u = units.get(k, {})
            q = f"{card['unit']} — state bin {card['bin']}. Define & give one example."
            a = "Definition, key properties, and one numeric example."
            f.write(f"{q}\t{a}\n")
    print(fmt_machine(f"Anki TSV exported → {ANKI_FILE}"))

def main():
    import argparse
    p = argparse.ArgumentParser(description="Roadie AI Math Agent (local)")
    p.add_argument("cmd", nargs="?", default="session", choices=["session","status","export-anki"])
    p.add_argument("-n","--n", type=int, default=5, help="questions per session")
    args = p.parse_args()
    if args.cmd == "session": run_session(n=args.n)
    elif args.cmd == "status": status()
    elif args.cmd == "export-anki": export_anki()

if __name__ == "__main__":
    main()
