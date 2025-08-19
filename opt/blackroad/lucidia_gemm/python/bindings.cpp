#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <torch/extension.h>
#include <ATen/cuda/CUDAContext.h>
#include "lucidia_gemm/common.h"

namespace py = pybind11;

namespace lucidia_gemm {
  // cutlass backend
  void run_cutlass_fp16fp32RowRowRow(const void* A, const void* B, void* C,
                                     int64_t M, int64_t N, int64_t K,
                                     int64_t lda, int64_t ldb, int64_t ldc,
                                     float alpha, float beta, cudaStream_t stream);
  // cublasLt backend
  void run_cublaslt_fp16fp32RowRowRow(const void* A, const void* B, void* C,
                                      int64_t M, int64_t N, int64_t K,
                                      int64_t lda, int64_t ldb, int64_t ldc,
                                      float alpha, float beta, cudaStream_t stream);
}

static Activation parse_activation(const std::string& s) {
  std::string t = s;
  for (auto &c : t) c = std::tolower(c);
  if (t == "none" || t.empty()) return Activation::None;
  if (t == "relu") return Activation::ReLU;
  if (t == "gelu") return Activation::GELU;
  throw std::invalid_argument("activation must be one of: none, relu, gelu");
}

static bool prefer_cutlass(int64_t M, int64_t N, int64_t K) {
  const char* env = std::getenv("LUCIDIA_GEMM_BACKEND");
  if (env) {
    std::string s(env);
    for (auto &c : s) c = std::tolower(c);
    if (s == "cutlass") return true;
    if (s == "cublaslt") return false;
  }
  // Heuristic: CUTLASS usually wins on small-M
  return M <= 128;
}

torch::Tensor gemm(torch::Tensor A, torch::Tensor B,
                   c10::optional<torch::Tensor> bias_opt,
                   const std::string& activation = "none",
                   bool transa = false, bool transb = false,
                   double alpha_d = 1.0, double beta_d = 0.0,
                   const std::string& out_dtype = "fp16") {
  TORCH_CHECK(A.is_cuda() && B.is_cuda(), "A and B must be CUDA tensors");
  TORCH_CHECK(A.dtype() == torch::kHalf && B.dtype() == torch::kHalf,
              "A and B must be float16");
  TORCH_CHECK(A.is_contiguous() && B.is_contiguous(),
              "A and B must be contiguous (row-major)");

  int64_t M = transa ? A.size(1) : A.size(0);
  int64_t K_a = transa ? A.size(0) : A.size(1);
  int64_t K_b = transb ? B.size(1) : B.size(0);
  int64_t N = transb ? B.size(0) : B.size(1);
  TORCH_CHECK(K_a == K_b, "Inner dimensions must match: got ", K_a, " vs ", K_b);
  int64_t K = K_a;

  // output as FP32 for compute, optionally cast to FP16 at the end
  auto optsF32 = A.options().dtype(torch::kFloat);
  auto C32 = torch::empty({M, N}, optsF32);

  float alpha = static_cast<float>(alpha_d);
  float beta  = static_cast<float>(beta_d);

  // Leading dimensions for row-major
  int64_t lda = transa ? M : K;
  int64_t ldb = transb ? K : N;
  int64_t ldc = N;

  // CUDA stream
  cudaStream_t stream = c10::cuda::getCurrentCUDAStream();
  const void* A_ptr = A.data_ptr();
  const void* B_ptr = B.data_ptr();
  void* C_ptr = C32.data_ptr();

  // Back-end selection
  if (prefer_cutlass(M, N, K)) {
    // CUTLASS expects row-major arguments as provided
    lucidia_gemm::run_cutlass_fp16fp32RowRowRow(
      A_ptr, B_ptr, C_ptr, M, N, K, lda, ldb, ldc, alpha, beta, stream);
  } else {
    // cuBLASLt
    lucidia_gemm::run_cublaslt_fp16fp32RowRowRow(
      A_ptr, B_ptr, C_ptr, M, N, K, lda, ldb, ldc, alpha, beta, stream);
  }

  // Optional bias + activation (post-process)
  Activation act = parse_activation(activation);
  const float* bias_ptr = nullptr;
  if (bias_opt.has_value()) {
    auto bias = bias_opt.value();
    TORCH_CHECK(bias.is_cuda(), "bias must be CUDA tensor");
    TORCH_CHECK(bias.dtype() == torch::kFloat || bias.dtype() == torch::kHalf,
                "bias must be float32 or float16");
    TORCH_CHECK(bias.numel() == N, "bias must be length N");
    if (bias.dtype() == torch::kHalf) bias = bias.to(torch::kFloat);
    bias_ptr = bias.data_ptr<float>();
  }

  int total = static_cast<int>(M * N);
  int block = 256;
  int grid = (total + block - 1) / block;
  bias_activation_kernel<<<grid, block, 0, stream>>>(
    C32.data_ptr<float>(), bias_ptr, (int)M, (int)N, act);
  LUCIDIA_CHECK_CUDART();

  // Output dtype
  std::string t = out_dtype;
  for (auto &c : t) c = std::tolower(c);
  if (t == "fp16" || t == "half") {
    return C32.to(torch::kHalf);
  } else if (t == "fp32" || t == "float") {
    return C32;
  } else {
    throw std::invalid_argument("out_dtype must be 'fp16' or 'fp32'");
  }
}

PYBIND11_MODULE(lucidia_gemm, m) {
  m.doc() = "Lucidia GEMM (CUTLASS + cuBLASLt), FP16->FP32 with optional bias/activation";
  m.def("gemm", &gemm,
        py::arg("A"), py::arg("B"),
        py::arg("bias") = py::none(),
        py::arg("activation") = "none",
        py::arg("transa") = false,
        py::arg("transb") = false,
        py::arg("alpha") = 1.0,
        py::arg("beta")  = 0.0,
        py::arg("out_dtype") = "fp16",
        R"doc(
Compute C = alpha * A @ B + beta * C0  (C0 initialized to zeros here),
then (optional) add column-wise bias and apply activation (none|relu|gelu).

Arguments:
  A: torch.cuda.HalfTensor [M, K] (row-major, contiguous)
  B: torch.cuda.HalfTensor [K, N] (row-major, contiguous)
  bias: optional torch.cuda.(Half|Float)Tensor [N]
  activation: "none" | "relu" | "gelu"
  transa, transb: if True, treat A/B as transposed without copying
  alpha, beta: scalars
  out_dtype: "fp16" or "fp32"
)doc");
  m.attr("__version__") = LUCIDIA_GEMM_VERSION;
}
