FROM python:3.11-slim AS builder
WORKDIR /app
COPY dist/wheels /wheels
RUN python -m venv /venv \
    && /venv/bin/pip install --no-index --find-links /wheels blackroad-prism-console

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /venv /venv
COPY dist/SBOM.spdx.json dist/SBOM.spdx.json
LABEL org.opencontainers.image.revision="unknown" \
      org.opencontainers.image.version="0.1.0" \
      sbom="/app/dist/SBOM.spdx.json"
ENV PATH=/venv/bin:$PATH
CMD ["python", "-m", "cli.console", "--help"]
