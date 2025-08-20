# Deterministic simulation environment for Lucidia agents
# Builds Trick, cFS, and TrickCFS from pinned commits with hardening flags

FROM ubuntu:22.04 AS build

# System dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

ENV TRICK_COMMIT="<TRICK_SHA>" \
    CFS_COMMIT="<CFS_SHA>" \
    TRICKCFS_COMMIT="<TRICKCFS_SHA>"

# Working directory
WORKDIR /opt/sim

# Clone sources (no network fetch allowed after build)
RUN git clone https://github.com/nasa/trick.git && \
    cd trick && git checkout "$TRICK_COMMIT" && cd .. && \
    git clone https://github.com/nasa/cFS.git && \
    cd cFS && git checkout "$CFS_COMMIT" && cd .. && \
    git clone https://github.com/nasa/TrickCFS.git && \
    cd TrickCFS && git checkout "$TRICKCFS_COMMIT"

# Build Trick
RUN cd trick && \
    ./configure --prefix=/usr/local/trick && \
    make -j$(nproc) && make install

# Build cFS
RUN cd cFS && \
    mkdir build && cd build && \
    cmake .. -DCMAKE_BUILD_TYPE=Release && \
    make -j$(nproc)

# Build TrickCFS example SIM_CFS
RUN cd TrickCFS && \
    sed -i 's/-O2/-O2 -fstack-protector-strong -D_FORTIFY_SOURCE=3 -fPIE -pie -Wl,-z,relro,-z,now/' Makefile && \
    make -j$(nproc) SIM_CFS

# Runtime image
FROM ubuntu:22.04

RUN useradd --system --uid 1000 sim
USER sim
WORKDIR /home/sim

COPY --from=build /opt/sim/TrickCFS/SIM_CFS .

ENTRYPOINT ["./SIM_CFS/SIM_CFS.exe"]
