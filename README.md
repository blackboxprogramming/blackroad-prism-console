# NVIDIA Open GPU Kernel Modules

This repository mirrors NVIDIA's open source GPU kernel modules and provides hardened build and packaging tooling.

## How to Build

Use the provided container image for reproducible builds:

```bash
docker build -f .codex/Dockerfile.kmod -t nvidia-open-kmod .
docker run --rm -v "$PWD:/src" -w /src nvidia-open-kmod make modules -j"$(nproc)"
```

## Supported Kernels / Architectures

- Kernels: 5.15, 6.1, 6.6
- Architectures: x86_64, aarch64

## DKMS Packages

After building, create DKMS packages (.deb and .rpm):

```bash
./.codex/make-dkms.sh 580.76.05
```

Packages are placed in `dist/`.

## Secure Boot

For Secure Boot environments, sign modules with your Machine Owner Key (MOK) and enroll the certificate using `mokutil --import`.

## License

Kernel modules in this repository are dual licensed under MIT/GPLv2. Proprietary NVIDIA userspace components are **not** distributed here.
Additional operational docs live in the [`docs/`](docs) folder.

## Experiments & Funnels

### Flip experiments (ChatOps)
Comment on any PR/Issue:

```
/exp set <id> active on|off weights A=<num> B=<num>
```

This edits `sites/blackroad/public/experiments.json`, commits, and pushes.

### Manage funnels (ChatOps)

```
/funnel set "Signup" window 14 steps cta_click,portal_open,signup_success
```

This edits `sites/blackroad/public/funnels.json`.

### Experiments dashboard
- Visit **/experiments** to preview experiments and generate the exact ChatOps command.

### Per-variant lift
- Conversions automatically include your A/B assignments (cookie `br_ab`) in `meta.ab`.
- **/metrics** shows A vs B counts and naïve rates per conversion id, plus **lift**.

### Funnels analytics
- Configure `public/funnels.json`. **/metrics** computes per-step counts, step rate, and cumulative rate (last 30 days).
- For very high volumes, move aggregation to the Worker/Durable Objects.

### Quick use

Flip an experiment:

```
/exp set new_nav active on weights A=0.4 B=0.6
```

Add a funnel:

```
/funnel set "Docs Journey" window 10 steps home_view,docs_view,docs_search,docs_copy_snippet
```

Record extra conversions from code:

```ts
import { recordConversion } from '@/lib/convert'
recordConversion('portal_open')
recordConversion('signup_success', 1, { plan: 'pro' })
```
