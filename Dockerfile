# --- base: python + node ---
FROM mcr.microsoft.com/devcontainers/python:3.11 as base
# Includes Debian, git, curl, common build tools

# Node 20 (via NodeSource)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs \
  && npm -v && node -v

# Poetry optional (not used by default) & jq for scripts
RUN apt-get update && apt-get install -y jq && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
COPY pyproject.toml ./
RUN pip install -U pip && pip install -e . || true

# --- website deps ---
FROM base as webdeps
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
# Choose your PM; default to npm if lock missing
RUN if [ -f package-lock.json ]; then npm ci; \
    elif [ -f yarn.lock ]; then npm i -g yarn && yarn --frozen-lockfile; \
    elif [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i --frozen-lockfile; \
    else npm init -y; fi

# --- runtime ---
FROM base as runtime
COPY . .
# Install Python test deps
RUN pip install -U pytest jsonschema
# Install web deps by copying from webdeps if present
COPY --from=webdeps /workspace/node_modules /workspace/node_modules

# Build site (optional; dev server uses on-demand build)
RUN npm run build --if-present || true

EXPOSE 3000
CMD ["bash", "-lc", "echo 'Dev container ready. Use: npm run dev (website) | pytest | brc ...'"]
