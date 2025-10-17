# Build xmrig with CUDA on Jetson (ARM64 + JetPack CUDA)
# Base has CUDA toolkit and nvidia-container-runtime hooks
# Jetson (ARM64) xmrig build with CUDA backend (learn-mode)
FROM nvcr.io/nvidia/l4t-cuda:12.2.0-runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    git build-essential cmake libuv1-dev libssl-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /opt
RUN git clone https://github.com/xmrig/xmrig.git && \
    mkdir -p xmrig/build

WORKDIR /opt/xmrig
# enable CUDA backend (good for demo; RandomX is still CPU-friendly)
RUN sed -i 's/"CUDA": false/"CUDA": true/' src/config.json.in || true

RUN git clone https://github.com/xmrig/xmrig.git && mkdir -p xmrig/build
WORKDIR /opt/xmrig/build
RUN cmake .. -DWITH_CUDA=ON -DWITH_HWLOC=OFF -DWITH_HTTPD=OFF && \
    make -j$(nproc)

WORKDIR /work
COPY jetson-run.sh /work/jetson-run.sh
RUN chmod +x /work/jetson-run.sh

# Use NVIDIA runtime
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=utility,compute

ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=utility,compute
ENTRYPOINT ["/work/jetson-run.sh"]
