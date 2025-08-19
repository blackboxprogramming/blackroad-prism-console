import torch, os
os.environ.setdefault("LUCIDIA_GEMM_BACKEND", "cutlass")
import lucidia_gemm as lg

def mlp_linear(a_fp16, W_fp16, bias_fp32=None, activation="gelu"):
    # a: [B, K], W: [K, N]  -> [B, N]
    out = lg.gemm(a_fp16, W_fp16, bias=bias_fp32, activation=activation, out_dtype="fp16")
    return out
