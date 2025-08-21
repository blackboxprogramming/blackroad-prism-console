# Minimal, non-root container for Materialite workloads
FROM mambaorg/micromamba:1.5.5-jammy

# Pin env creation; environment.yml lives next to this Dockerfile
COPY --chown=$MAMBA_USER:$MAMBA_USER environment.yml /tmp/env.yml
RUN micromamba install -y -n base -f /tmp/env.yml && \
    micromamba clean -a -y

# Create a non-root user (already provided by micromamba image)
USER $MAMBA_USER
WORKDIR /app

# Copy mirrored Materialite repo (read‑only at runtime)
# Expect third_party/materialite/ with LICENSE & pinned commit
COPY --chown=$MAMBA_USER:$MAMBA_USER third_party/materialite /opt/materialite

# Copy service code
COPY --chown=$MAMBA_USER:$MAMBA_USER services/materials_service /app/services

# No ENTRYPOINT: runtime wrapper will launch uvicorn with --network=none
