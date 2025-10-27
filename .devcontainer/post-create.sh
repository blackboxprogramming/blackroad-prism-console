#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Setting up BlackRoad development environment..."

# Ensure tools installed with --user are available on PATH for the current session.
export PATH="${HOME}/.local/bin:${PATH}"

# Install global Node.js tools when npm is available. We avoid failing the
# entire setup when npm is missing so contributors still get a mostly-working
# environment.
if command -v npm >/dev/null 2>&1; then
  echo "📦 Installing global Node.js tools..."
  npm install -g commitlint @commitlint/config-conventional
else
  echo "⚠️ npm not found; skipping global Node.js tool installation" >&2
fi

# Install Python dependencies from both the primary and dev requirement files.
# We install with --user so that packages live in the vscode user's home
# directory instead of the system python path.
if command -v pip3 >/dev/null 2>&1; then
  echo "🐍 Installing Python dependencies..."
  if [ -f requirements.txt ]; then
    pip3 install --user -r requirements.txt
  fi

  if [ -f requirements-dev.txt ]; then
    pip3 install --user -r requirements-dev.txt
  fi
else
  echo "⚠️ pip3 not found; skipping Python dependency installation" >&2
fi

# Install and configure pre-commit hooks when the configuration file exists.
if command -v pip3 >/dev/null 2>&1; then
  echo "🪝 Installing pre-commit hooks..."
  pip3 install --user pre-commit
  if [ -f .pre-commit-config.yaml ]; then
    pre-commit install || true
  fi
else
  echo "⚠️ pip3 not found; skipping pre-commit installation" >&2
fi

# Install project-level Node.js dependencies if a package.json is present.
if command -v npm >/dev/null 2>&1 && [ -f package.json ]; then
  echo "📚 Installing Node.js project dependencies..."
  npm install
fi

# Create a starter .env file to help contributors get up and running quickly.
if [ ! -f .env ] && [ -f .env.example ]; then
  echo "📝 Creating .env file from .env.example..."
  cp .env.example .env
fi

echo "✅ Environment setup complete!"
echo ""
echo "Quick start commands:"
echo "  npm run dev                   # Start the website at http://localhost:3000"
echo "  pytest -q                    # Run tests"
echo "  npm run lint                 # Lint code"
echo "  npm run format               # Format code"
echo ""
echo "Happy coding! 🎉"
