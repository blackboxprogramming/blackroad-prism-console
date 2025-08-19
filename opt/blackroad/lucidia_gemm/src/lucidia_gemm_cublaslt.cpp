#include <cublasLt.h>
#include <cuda_runtime.h>
#include <stdexcept>
#include "lucidia_gemm/common.h"

namespace lucidia_gemm {

static inline cublasLtHandle_t& lt_handle() {
  static cublasLtHandle_t handle = []{
    cublasLtHandle_t h;
    if (cublasLtCreate(&h) != CUBLAS_STATUS_SUCCESS) {
      throw std::runtime_error("cublasLtCreate failed");
    }
    return h;
  }();
  return handle;
}

void run_cublaslt_fp16fp32RowRowRow(const void* A, const void* B, void* C,
                                    int64_t M, int64_t N, int64_t K,
                                    int64_t lda, int64_t ldb, int64_t ldc,
                                    float alpha, float beta, cudaStream_t stream) {
  auto& handle = lt_handle();

  cublasOperation_t transA = CUBLAS_OP_N;
  cublasOperation_t transB = CUBLAS_OP_N;

  cublasComputeType_t computeType = CUBLAS_COMPUTE_32F;
  cudaDataType_t scaleType = CUDA_R_32F;

  cublasLtMatmulDesc_t matmulDesc;
  cublasLtMatrixLayout_t aDesc, bDesc, cDesc, dDesc;

  if (cublasLtMatmulDescCreate(&matmulDesc, computeType, scaleType) != CUBLAS_STATUS_SUCCESS)
    throw std::runtime_error("cublasLtMatmulDescCreate failed");

  cublasLtMatmulDescSetAttribute(matmulDesc, CUBLASLT_MATMUL_DESC_TRANSA, &transA, sizeof(transA));
  cublasLtMatmulDescSetAttribute(matmulDesc, CUBLASLT_MATMUL_DESC_TRANSB, &transB, sizeof(transB));

  if (cublasLtMatrixLayoutCreate(&aDesc, CUDA_R_16F, K, M, lda) != CUBLAS_STATUS_SUCCESS)
    throw std::runtime_error("a layout failed");
  if (cublasLtMatrixLayoutCreate(&bDesc, CUDA_R_16F, N, K, ldb) != CUBLAS_STATUS_SUCCESS)
    throw std::runtime_error("b layout failed");
  if (cublasLtMatrixLayoutCreate(&cDesc, CUDA_R_32F, N, M, ldc) != CUBLAS_STATUS_SUCCESS)
    throw std::runtime_error("c layout failed");
  if (cublasLtMatrixLayoutCreate(&dDesc, CUDA_R_32F, N, M, ldc) != CUBLAS_STATUS_SUCCESS)
    throw std::runtime_error("d layout failed");

  cublasLtMatmulPreference_t preference;
  cublasLtMatmulPreferenceCreate(&preference);
  size_t workspaceLimit = 1ULL << 26; // 64MB
  cublasLtMatmulPreferenceSetAttribute(preference, CUBLASLT_MATMUL_PREF_MAX_WORKSPACE_BYTES, &workspaceLimit, sizeof(workspaceLimit));

  // Choose heuristic
  cublasLtMatmulHeuristicResult_t heuristic;
  int returnedResults = 0;
  if (cublasLtMatmulAlgoGetHeuristic(handle, matmulDesc, aDesc, bDesc, cDesc, dDesc,
                                     preference, 1, &heuristic, &returnedResults) != CUBLAS_STATUS_SUCCESS
      || returnedResults == 0) {
    cublasLtMatmulPreferenceDestroy(preference);
    cublasLtMatrixLayoutDestroy(aDesc);
    cublasLtMatrixLayoutDestroy(bDesc);
    cublasLtMatrixLayoutDestroy(cDesc);
    cublasLtMatrixLayoutDestroy(dDesc);
    cublasLtMatmulDescDestroy(matmulDesc);
    throw std::runtime_error("cublasLt heuristic selection failed");
  }

  cublasLtEpilogue_t epi = CUBLASLT_EPILOGUE_DEFAULT; // we post-process ourselves
  cublasLtMatmulDescSetAttribute(matmulDesc, CUBLASLT_MATMUL_DESC_EPILOGUE, &epi, sizeof(epi));

  cublasStatus_t status = cublasLtMatmul(
      handle,
      matmulDesc,
      &alpha,
      B, bDesc,    // Note: RowMajor with lt uses col-major semantics; swapping roles keeps row-major logical
      A, aDesc,
      &beta,
      C, cDesc,
      C, dDesc,
      &heuristic.algo,
      nullptr, 0,
      stream);

  cublasLtMatmulPreferenceDestroy(preference);
  cublasLtMatrixLayoutDestroy(aDesc);
  cublasLtMatrixLayoutDestroy(bDesc);
  cublasLtMatrixLayoutDestroy(cDesc);
  cublasLtMatrixLayoutDestroy(dDesc);
  cublasLtMatmulDescDestroy(matmulDesc);

  if (status != CUBLAS_STATUS_SUCCESS) {
    throw std::runtime_error("cublasLtMatmul failed");
  }
}

} // namespace lucidia_gemm
