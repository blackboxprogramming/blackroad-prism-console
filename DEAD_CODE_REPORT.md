<!-- FILE: DEAD_CODE_REPORT.md -->
# Dead Code Report

| Path | Reason for Removal | Reference Check |
|------|-------------------|-----------------|
| `.env.aider` | Local Aider environment template; not used by runtime. | `rg \.env.aider` returned no matches. |
| `index.html` | Legacy portal shell superseded by `var/www/blackroad/index.html`. | `rg "Codex Portal"` found only this file. |
| `interesting.html` | Experimental HTML page with no incoming references. | `rg interesting.html` returned no matches. |
