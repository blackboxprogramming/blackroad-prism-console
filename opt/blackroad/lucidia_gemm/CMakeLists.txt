cmake_minimum_required(VERSION 3.20)
project(lucidia_gemm LANGUAGES CXX CUDA)

# ---------- Options ----------
option(USE_FETCHCONTENT_CUTLASS "Fetch CUTLASS with CMake if CUTLASS_DIR not set" ON)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CUDA_STANDARD 17)
set(CMAKE_BUILD_TYPE Release CACHE STRING "Build type" FORCE)

# Target Orin (Ampere SM 8.7). Add others if you like: 80;86;89;90
set(CMAKE_CUDA_ARCHITECTURES 87)

# ---------- Dependencies ----------
find_package(Python3 REQUIRED COMPONENTS Interpreter Development.Module)
find_package(pybind11 REQUIRED)
find_package(Torch REQUIRED)
find_package(CUDAToolkit REQUIRED)

# CUTLASS: either provide CUTLASS_DIR to a local checkout, or fetch it.
if(DEFINED CUTLASS_DIR)
  message(STATUS "Using CUTLASS from ${CUTLASS_DIR}")
  set(CUTLASS_INCLUDE_DIR "${CUTLASS_DIR}/include" CACHE PATH "" FORCE)
else()
  if(USE_FETCHCONTENT_CUTLASS)
    include(FetchContent)
    FetchContent_Declare(
      cutlass
      GIT_REPOSITORY https://github.com/NVIDIA/cutlass.git
      GIT_TAG v3.5.1
    )
    FetchContent_MakeAvailable(cutlass)
    set(CUTLASS_INCLUDE_DIR "${cutlass_SOURCE_DIR}/include" CACHE PATH "" FORCE)
  else()
    message(FATAL_ERROR "CUTLASS_DIR not set and USE_FETCHCONTENT_CUTLASS=OFF")
  endif()
endif()

# ---------- Sources ----------
set(LUCIDIA_GEMM_SOURCES
  src/lucidia_gemm_cutlass.cu
  src/lucidia_gemm_cublaslt.cpp
  python/bindings.cpp
)

add_library(lucidia_gemm MODULE ${LUCIDIA_GEMM_SOURCES})

target_include_directories(lucidia_gemm PRIVATE
  ${CUTLASS_INCLUDE_DIR}
  ${TORCH_INCLUDE_DIRS}
  ${Python3_INCLUDE_DIRS}
  ${CUDAToolkit_INCLUDE_DIRS}
  include
)

target_link_libraries(lucidia_gemm PRIVATE
  pybind11::module
  ${TORCH_LIBRARIES}
  CUDA::cudart
  CUDA::cublas
  CUDA::cublasLt
)

# Disable prefix "lib" and ensure correct python module suffix
set_target_properties(lucidia_gemm PROPERTIES
  PREFIX ""
  SUFFIX "${Python3_EXTENSION_SUFFIX}"
)

# Compile flags
target_compile_definitions(lucidia_gemm PRIVATE
  -D_GLIBCXX_USE_CXX11_ABI=$<IF:$<BOOL:${GLIBCXX_USE_CXX11_ABI}>,1,1>
  -DLUCIDIA_GEMM_VERSION=\"0.1.0\"
)

target_compile_options(lucidia_gemm PRIVATE
  $<$<COMPILE_LANGUAGE:CUDA>:
    --expt-relaxed-constexpr
    --expt-extended-lambda
    --use_fast_math
    -O3
  >
  $<$<COMPILE_LANGUAGE:CXX>:
    -O3
    -fno-exceptions
  >
)

# RPATH so the module finds Torch/ CUDA at runtime
if(APPLE)
  # not needed
else()
  set_property(TARGET lucidia_gemm PROPERTY INSTALL_RPATH_USE_LINK_PATH TRUE)
endif()

message(STATUS "Torch includes: ${TORCH_INCLUDE_DIRS}")
message(STATUS "CUTLASS includes: ${CUTLASS_INCLUDE_DIR}")
