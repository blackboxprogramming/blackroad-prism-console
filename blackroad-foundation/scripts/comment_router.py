import os, re, subprocess, sys
comment = sys.argv[1] if len(sys.argv)>1 else ""
m = re.search(r"@codex fix (.+)", comment, re.I)
if not m: sys.exit(0)
task = m.group(1).strip()
# naive router: add a TODO or tweak files based on keywords
if "lint" in task:
  subprocess.run(["bash","-lc","pnpm -w run format && pnpm -w run lint"], check=False)
elif "analytics" in task:
  open("tools/analytics_client.py","a").write("\n# TODO: extend analytics\n")
else:
  open("README.md","a").write(f"\n\n> Bot note: {task}\n")
