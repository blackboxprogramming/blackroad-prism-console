#!/bin/bash

echo "Setting up BlackRoad websites..."

# Create necessary directories
mkdir -p public/css
mkdir -p public/js
mkdir -p public/images
mkdir -p logs/nginx
mkdir -p api

# Add entries to /etc/hosts for local development (requires sudo)
echo "Adding entries to /etc/hosts..."
if ! grep -q "blackroad.io" /etc/hosts; then
    echo "127.0.0.1 blackroad.io www.blackroad.io" | sudo tee -a /etc/hosts
fi

if ! grep -q "blackroadinc.us" /etc/hosts; then
    echo "127.0.0.1 blackroadinc.us www.blackroadinc.us" | sudo tee -a /etc/hosts
fi

# Create a simple API server if the api directory doesn't exist

#!/bin/bash
# BlackRoad Prism Console Unified Setup Script
# Installs dependencies, sets up environment, and starts backend, frontend, and LLM services.

set -e

echo "[1/5] Running ops/install.sh to setup environment and dependencies..."
if [ -f ./ops/install.sh ]; then
    bash ./ops/install.sh
else
    echo "ERROR: ./ops/install.sh not found!"
    exit 1
fi

echo "[2/5] Checking .env file..."
if [ ! -f .env ]; then
    echo "SESSION_SECRET=changeme" > .env
    echo "INTERNAL_TOKEN=changeme" >> .env
    echo "Created default .env file. Please update secrets as needed."
fi

echo "[3/5] Installing Node.js dependencies..."
npm install

echo "[4/5] Starting backend API (npm run dev)..."
npm run dev &
BACKEND_PID=$!
sleep 2

echo "[5/5] Starting frontend (npm run frontend:dev)..."
npm run frontend:dev &
FRONTEND_PID=$!
sleep 2

echo "[LLM] Starting LLM service if available..."
if [ -d srv/lucidia-llm ]; then
    cd srv/lucidia-llm
    if [ -f test_app.py ]; then
        nohup python3 -m uvicorn test_app:app --port 8000 &
        echo "LLM service started on port 8000."
    else
        echo "LLM FastAPI app not found (test_app.py missing)."
    fi
    cd ../..
else
    echo "LLM service directory not found. Skipping."
fi

echo "All core services started."
echo "Backend API (port 4000), Frontend, and LLM (port 8000 if available) are running."
echo "To stop, use 'kill $BACKEND_PID $FRONTEND_PID' or close this terminal."

