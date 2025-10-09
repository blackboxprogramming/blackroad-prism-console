#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Setting up BlackRoad development environment..."

# Install global Node.js tools
echo "📦 Installing global Node.js tools..."
npm install -g commitlint @commitlint/config-conventional

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
if [ -f requirements.txt ]; then
  pip3 install --user -r requirements.txt
fi

if [ -f requirements-dev.txt ]; then
  pip3 install --user -r requirements-dev.txt
fi

# Install pre-commit hooks
echo "🪝 Installing pre-commit hooks..."
pip3 install --user pre-commit
if [ -f .pre-commit-config.yaml ]; then
  pre-commit install || true
fi

# Install Node.js project dependencies
echo "📚 Installing Node.js project dependencies..."
if [ -f package.json ]; then
  npm install
fi

# Create .env from example if it doesn't exist
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
