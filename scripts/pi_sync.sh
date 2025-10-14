#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: ./scripts/pi_sync.sh [-n] [-r user@host:/path] [-s source_dir] [-- extra_rsync_args]

Synchronize the local repository to a remote Raspberry Pi (or any SSH host)
using rsync. Defaults target to alice@raspberrypi:~/blackroad-prism-console.

Options:
  -n              Perform a dry run and show which files would change.
  -r REMOTE       Override the remote destination (user@host:/path).
                  You can also set the PI_REMOTE environment variable.
  -s SOURCE       Source directory to sync (defaults to the repo root).
  -h              Show this help message.

Any arguments after `--` are passed directly to rsync.
USAGE
}

if [[ ${1:-} == "--help" ]]; then
  usage
  exit 0
fi

dry_run=false
remote=${PI_REMOTE:-"alice@raspberrypi:~/blackroad-prism-console"}
repo_root=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
source_dir="$repo_root/"

while getopts ":hnr:s:" opt; do
  case "$opt" in
    h)
      usage
      exit 0
      ;;
    n)
      dry_run=true
      ;;
    r)
      remote="$OPTARG"
      ;;
    s)
      source_dir="$OPTARG"
      if [[ -d "$source_dir" ]]; then
        source_dir="$(cd "$source_dir" && pwd)/"
      else
        echo "[ERROR] Source directory '$source_dir' does not exist" >&2
        exit 1
      fi
      ;;
    :)
      echo "[ERROR] Option -$OPTARG requires an argument" >&2
      usage
      exit 1
      ;;
    \?)
      echo "[ERROR] Unknown option -$OPTARG" >&2
      usage
      exit 1
      ;;
  esac

done
shift $((OPTIND - 1))

extra_rsync_args=("$@")

if ! command -v rsync >/dev/null 2>&1; then
  echo "[ERROR] rsync is required but not installed" >&2
  exit 1
fi

if ! command -v ssh >/dev/null 2>&1; then
  echo "[ERROR] ssh is required but not installed" >&2
  exit 1
fi

rsync_opts=(-az --delete --info=stats2,progress2)

if [[ "$dry_run" == true ]]; then
  rsync_opts+=(--dry-run)
fi

exclude_file="$repo_root/scripts/pi_sync_exclude.txt"
if [[ -f "$exclude_file" ]]; then
  rsync_opts+=("--exclude-from=$exclude_file")
fi

rsync_cmd=(rsync "${rsync_opts[@]}")
if [[ ${#extra_rsync_args[@]} -gt 0 ]]; then
  rsync_cmd+=("${extra_rsync_args[@]}")
fi
rsync_cmd+=("$source_dir" "$remote")

echo "[INFO] Syncing $source_dir to $remote"
"${rsync_cmd[@]}"

echo "[INFO] Sync complete"
