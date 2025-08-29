<!-- FILE: RUNME.sh -->
#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if [ ! -f srv/blackroad-api/.env ]; then
  cp srv/blackroad-api/.env.sample srv/blackroad-api/.env
fi
npm install
npm run lint || true
npx prettier . --check || true
npm test || true
pytest tests/lucidia_llm_stub_test.py || true
echo "Setup complete. Run 'npm start' to launch the API."
