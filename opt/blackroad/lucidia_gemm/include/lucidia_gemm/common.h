#pragma once
#include <cstdint>
#include <stdexcept>
#include <cuda_runtime.h>

#define LUCIDIA_CHECK_CUDA(expr)                                                   \
  do {                                                                             \
    cudaError_t _err = (expr);                                                     \
    if (_err != cudaSuccess) {                                                     \
      throw std::runtime_error(std::string("CUDA error: ") +                       \
        cudaGetErrorString(_err) + " at " + __FILE__ + ":" + std::to_string(__LINE__)); \
    }                                                                              \
  } while (0)

#define LUCIDIA_CHECK_CUDART()                                                     \
  do {                                                                             \
    cudaError_t _err = cudaGetLastError();                                         \
    if (_err != cudaSuccess) {                                                     \
      throw std::runtime_error(std::string("CUDA kernel error: ") +                \
        cudaGetErrorString(_err) + " at " + __FILE__ + ":" + std::to_string(__LINE__)); \
    }                                                                              \
  } while (0)

enum class Activation : int32_t { None = 0, ReLU = 1, GELU = 2 };

// fast GELU (tanh approximation)
__device__ __forceinline__ float gelu_fast(float x) {
  const float kAlpha = 0.7978845608028654f;   // sqrt(2/pi)
  const float kBeta  = 0.044715f;
  float x3 = x * x * x;
  float inner = kAlpha * (x + kBeta * x3);
  return 0.5f * x * (1.0f + tanhf(inner));
}

// post-processing kernel: add column-wise bias[N] then activation
__global__ void bias_activation_kernel(float* __restrict__ C,
                                       const float* __restrict__ bias, // nullable
                                       int M, int N, Activation act) {
  int idx = blockIdx.x * blockDim.x + threadIdx.x;
  int size = M * N;
  if (idx >= size) return;
  int col = idx % N;
  float v = C[idx];
  if (bias) v += bias[col];
  if (act == Activation::ReLU) {
    v = v > 0.f ? v : 0.f;
  } else if (act == Activation::GELU) {
    v = gelu_fast(v);
  }
  C[idx] = v;
}
