# Tiny REPL to talk to the service in plain text. Local only.
import shlex

from lucidia_diffusion_agent import generate

HELP = """commands:
  gen class=<int|text> n=<int> size=<int> scale=<float> seed=<int> steps=<respacing>
  help
  quit
examples:
  gen class=207 n=8 size=256 scale=1.2
  gen class="golden retriever" n=4
"""


def parse_kv(args):
    kv = {}
    for tok in args:
        if "=" in tok:
            k, v = tok.split("=", 1)
            kv[k.strip()] = v.strip().strip('"').strip("'")
    return kv


def main():
    print("blackroad::diffusion chit-chat ready. type 'help' for usage.")
    while True:
        try:
            line = input("> ").strip()
        except EOFError:
            break
        if not line:
            continue
        if line in ("quit", "exit"):
            break
        if line == "help":
            print(HELP)
            continue
        if line.startswith("gen"):
            kv = parse_kv(shlex.split(line)[1:])
            cls = kv.get("class", None)
            if cls is None:
                print("Missing class=<int|text>")
                continue
            try:
                cls_val = int(cls)
            except ValueError:
                cls_val = cls
            n = int(kv.get("n", 4))
            size = int(kv.get("size", 256))
            scale = float(kv.get("scale", 1.0))
            seed = kv.get("seed", None)
            seed = int(seed) if seed is not None else None
            steps = kv.get("steps", "250")
            out = generate(
                cls_val,
                n=n,
                image_size=size,
                classifier_scale=scale,
                seed=seed,
                timestep_respacing=steps,
            )
            print(f"saved => {out['run_dir']}")
            continue
        print("Unknown command. type 'help'.")


if __name__ == "__main__":
    main()
