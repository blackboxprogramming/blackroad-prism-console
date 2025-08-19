#include <cutlass/cutlass.h>
#include <cutlass/half.h>
#include <cutlass/layout/matrix.h>
#include <cutlass/arch/arch.h>
#include <cutlass/gemm/device/gemm.h>
#include <cutlass/gemm/threadblock/default_mma_core_sm80.h>
#include <cutlass/epilogue/thread/linear_combination.h>

#include <cuda_runtime.h>
#include <stdexcept>
#include "lucidia_gemm/common.h"

namespace lucidia_gemm {

// FP16 inputs, FP32 accumulate, FP32 output
using ElementInputA = cutlass::half_t;
using ElementInputB = cutlass::half_t;
using ElementAccumulator = float;
using ElementOutput = float;

using LayoutA = cutlass::layout::RowMajor;
using LayoutB = cutlass::layout::RowMajor;
using LayoutC = cutlass::layout::RowMajor;

using EpilogueOp = cutlass::epilogue::thread::LinearCombination<
    ElementOutput, /*ElementsPerAccess*/ 4, ElementAccumulator, ElementAccumulator>;

using Gemm = cutlass::gemm::device::Gemm<
    ElementInputA, LayoutA,
    ElementInputB, LayoutB,
    ElementOutput,  LayoutC,
    ElementAccumulator,
    cutlass::arch::OpClassTensorOp,
    cutlass::arch::Sm80, // valid for SM80+ (Orin SM87 compatible)
    cutlass::gemm::GemmShape<128, 64, 64>,      // Threadblock tile
    cutlass::gemm::GemmShape<64, 64, 64>,       // Warp tile
    cutlass::gemm::GemmShape<16, 8, 8>,         // MMA op tile (Tensor Cores)
    EpilogueOp,
    cutlass::gemm::threadblock::GemmIdentityThreadblockSwizzle<>,
    2 // stages
>;

void run_cutlass_fp16fp32RowRowRow(const void* A, const void* B, void* C,
                                   int64_t M, int64_t N, int64_t K,
                                   int64_t lda, int64_t ldb, int64_t ldc,
                                   float alpha, float beta, cudaStream_t stream) {
  typename Gemm::Arguments args(
      {int(M), int(N), int(K)},
      {reinterpret_cast<ElementInputA const*>(A), int(lda)},
      {reinterpret_cast<ElementInputB const*>(B), int(ldb)},
      {reinterpret_cast<ElementOutput const*>(C), int(ldc)}, // C source for beta
      {reinterpret_cast<ElementOutput*>(C), int(ldc)},
      {alpha, beta});

  Gemm op;
  cutlass::Status st = op.initialize(args, stream);
  if (st != cutlass::Status::kSuccess) {
    throw std::runtime_error("CUTLASS initialize failed");
  }
  st = op(stream);
  if (st != cutlass::Status::kSuccess) {
    throw std::runtime_error("CUTLASS run failed");
  }
}

} // namespace lucidia_gemm
