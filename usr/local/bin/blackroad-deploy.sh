#!/bin/bash
set -euo pipefail
LOG_DIR=/var/log/blackroad-deploy
mkdir -p "$LOG_DIR"
JOBID=$(date +%s)
LOGFILE="$LOG_DIR/$JOBID.log"
BRANCH="main"
SHA=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --branch) BRANCH="$2"; shift 2;;
    --sha) SHA="$2"; shift 2;;
    *) shift;;
  esac
done
{
  echo "$(date -Is) starting deploy branch=$BRANCH sha=$SHA"
  node - <<'NODE' "$BRANCH" "$SHA"
const deploy = require('/srv/blackroad-api/lib/deploy');
const [branch, sha] = process.argv.slice(2);
deploy.stageAndSwitch({ branch, sha }).then(r=>{
  console.log('releaseId', r.releaseId);
}).catch(e=>{ console.error(e); process.exit(1); });
NODE
} >> "$LOGFILE" 2>&1
