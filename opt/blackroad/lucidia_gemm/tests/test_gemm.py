import torch, os, time, math

def check_one(M, N, K, act="none"):
    A = torch.randn(M, K, device="cuda", dtype=torch.float16)
    B = torch.randn(K, N, device="cuda", dtype=torch.float16)
    bias = torch.randn(N, device="cuda", dtype=torch.float32)

    import lucidia_gemm as lg
    C = lg.gemm(A, B, bias=bias, activation=act, out_dtype="fp32")
    # Reference
    C_ref = (A.float() @ B.float())
    if bias is not None:
        C_ref = C_ref + bias
    if act == "relu":
        C_ref = torch.nn.functional.relu(C_ref)
    elif act == "gelu":
        C_ref = torch.nn.functional.gelu(C_ref, approximate="tanh")

    err = (C - C_ref).abs().max().item()
    print(f"M={M} N={N} K={K} act={act} max|err|={err:.3e}")
    assert err < 2e-2, f"excess error {err}"

def bench(M, N, K, repeats=50):
    A = torch.randn(M, K, device="cuda", dtype=torch.float16)
    B = torch.randn(K, N, device="cuda", dtype=torch.float16)
    import lucidia_gemm as lg
    # warmup
    for _ in range(5):
        lg.gemm(A, B, activation="none", out_dtype="fp16")
    torch.cuda.synchronize()

    t0 = time.time()
    for _ in range(repeats):
        lg.gemm(A, B, activation="none", out_dtype="fp16")
    torch.cuda.synchronize()
    dt = (time.time() - t0) / repeats
    tflops = (2.0 * M * N * K) / (dt * 1e12)
    print(f"[lucidia_gemm] {M}x{N}x{K}: {dt*1e3:.3f} ms, {tflops:.2f} TFLOP/s")

    # cuBLAS reference for comparison
    t0 = time.time()
    for _ in range(repeats):
        (A.float() @ B.float()).half()
    torch.cuda.synchronize()
    dt2 = (time.time() - t0) / repeats
    tflops2 = (2.0 * M * N * K) / (dt2 * 1e12)
    print(f"[torch matmul] {M}x{N}x{K}: {dt2*1e3:.3f} ms, {tflops2:.2f} TFLOP/s")

if __name__ == "__main__":
    torch.backends.cuda.matmul.allow_tf32 = True
    os.environ.setdefault("LUCIDIA_GEMM_BACKEND", "cutlass")
    for act in ["none", "relu", "gelu"]:
        for M in [16, 32, 64, 128]:
            for N in [1024, 2048]:
                for K in [1024, 2048]:
                    check_one(M, N, K, act=act)
    bench(64, 2048, 2048)
