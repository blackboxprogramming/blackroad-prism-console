<!-- FILE: RUNME.sh -->
#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if [ ! -f srv/blackroad-api/.env ]; then
  cp srv/blackroad-api/.env.sample srv/blackroad-api/.env
fi
npm install
npm run format:check
npm run lint
npm test
pip install fastapi pydantic pytest httpx >/dev/null 2>&1 || true
pytest srv/lucidia-llm/test_app.py
echo "Setup complete. Run 'npm start' to launch the API."
