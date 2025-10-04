# Universal Simulation Starter — Installation

The real solver passes are optional. The default `make orchestrate` flow uses the
numerical stubs bundled with the repo so you can validate the pipeline without
heavy dependencies. When you are ready to flip to full simulations install the
packages below.

## PySPH (fluid benchmark)

```bash
python3 -m pip install pysph
```

PySPH 1.0+ ships with pre-built wheels for CPython 3.9–3.12 on Linux and macOS.
If you are compiling from source make sure `cython` is available and that a C++
compiler (gcc/clang) is on your `PATH`.

After installing run:

```bash
make pysph-real
```

This executes `30_bench_fluid/pysph_real_tank.py`, writes velocity, pressure and
free-surface snapshots into `universal_sim/artifacts/bench/fluid/`, and leaves
stubs untouched if PySPH is not present.

## Taichi (solid benchmark)

```bash
python3 -m pip install taichi
```

The script targets Taichi v1.7+. CPU execution is the default; pass
`TAICHI_ARCH=gpu` if you have CUDA installed. After installation run:

```bash
make mpm-real
```

`20_bench_solid/taichi_mpm_real_soft.py` emits displacement and Von Mises stress
fields under `universal_sim/artifacts/bench/solid/`. When Taichi is missing the
script gracefully falls back to the synthetic lattice deformation so the rest of
the pipeline keeps working.
