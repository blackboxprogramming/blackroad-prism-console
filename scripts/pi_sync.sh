#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: ./scripts/pi_sync.sh [options] [-- extra_rsync_args]

Synchronize this repository with a remote Raspberry Pi (or any SSH host)
using rsync. By default the script pushes the current repo to
alice@raspberrypi:~/blackroad-prism-console.

Options:
  -n                Perform a dry run and show which files would change.
  -r REMOTE         Override the remote spec (user@host:/path). You can
                    also set the PI_REMOTE environment variable.
  -s PATH           Local path to sync. Defaults to the repository root.
  -x FILE           Override the exclude file (defaults to
                    scripts/pi_sync_exclude.txt). You can also set the
                    PI_SYNC_EXCLUDE environment variable.
  --pull            Pull from the remote to the local path instead of pushing.
  -h, --help        Show this help message.

Any arguments after `--` are passed directly to rsync.
USAGE
}

join_remote_path() {
  local base="$1"
  local sub="$2"

  if [[ -z "$sub" ]]; then
    printf '%s' "$base"
    return
  fi

  case "$base" in
    .)
      printf '%s' "$sub"
      return
      ;;
    /)
      printf '/%s' "$sub"
      return
      ;;
  esac

  while [[ "$base" == */ && "$base" != "/" && "$base" != "~" ]]; do
    base=${base%/}
  done

  printf '%s/%s' "$base" "$sub"
}

if [[ ${1:-} == "--help" || ${1:-} == "-h" ]]; then
  usage
  exit 0
fi

dry_run=false
direction="push"
remote=${PI_REMOTE:-"alice@raspberrypi:~/blackroad-prism-console"}
repo_root=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
local_path="$repo_root"
exclude_file=${PI_SYNC_EXCLUDE:-"$repo_root/scripts/pi_sync_exclude.txt"}
extra_rsync_args=()
subdir_specified=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -n)
      dry_run=true
      shift
      ;;
    -r)
      if [[ $# -lt 2 ]]; then
        echo "[ERROR] Option -r requires an argument" >&2
        usage
        exit 1
      fi
      remote="$2"
      shift 2
      ;;
    -s)
      if [[ $# -lt 2 ]]; then
        echo "[ERROR] Option -s requires an argument" >&2
        usage
        exit 1
      fi
      local_path="$2"
      subdir_specified=true
      shift 2
      ;;
    -x)
      if [[ $# -lt 2 ]]; then
        echo "[ERROR] Option -x requires an argument" >&2
        usage
        exit 1
      fi
      exclude_file="$2"
      shift 2
      ;;
    --pull)
      direction="pull"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    --)
      shift
      extra_rsync_args=("$@")
      break
      ;;
    *)
      echo "[ERROR] Unknown option '$1'" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ "$remote" != *:* ]]; then
  echo "[ERROR] Remote must include a host and path (user@host:/path)" >&2
  exit 1
fi

remote_host=${remote%%:*}
remote_path=${remote#*:}
if [[ -z "$remote_host" ]]; then
  echo "[ERROR] Remote host cannot be empty" >&2
  exit 1
fi
if [[ -z "$remote_path" ]]; then
  remote_path="."
fi

if [[ ! -d "$local_path" ]]; then
  if [[ "$direction" == "pull" ]]; then
    mkdir -p "$local_path"
  else
    echo "[ERROR] Source directory '$local_path' does not exist" >&2
    exit 1
  fi
fi

local_path=$(cd "$local_path" && pwd)
remote_effective_path="$remote_path"
disable_delete=false

if [[ "$subdir_specified" == true ]]; then
  if [[ "$local_path" == "$repo_root" ]]; then
    :
  else
    repo_root_with_slash="$repo_root/"
    if [[ "$local_path" == "$repo_root_with_slash"* ]]; then
      remote_subpath=${local_path#"$repo_root_with_slash"}
      remote_effective_path=$(join_remote_path "$remote_path" "$remote_subpath")
    else
      echo "[WARN] Local path '$local_path' is outside the repository; disabling --delete for safety" >&2
      disable_delete=true
    fi
  fi
fi

remote_spec="$remote_host:$remote_effective_path"

if [[ "$direction" == "push" ]]; then
  source_arg="$local_path/"
  dest_arg="$remote_spec"
else
  source_arg="$remote_spec"
  dest_arg="$local_path/"
fi

if ! command -v rsync >/dev/null 2>&1; then
  echo "[ERROR] rsync is required but not installed" >&2
  exit 1
fi

if ! command -v ssh >/dev/null 2>&1; then
  echo "[ERROR] ssh is required but not installed" >&2
  exit 1
fi

rsync_opts=(-az --info=stats2,progress2 --filter=':- .gitignore')
if [[ "$direction" == "push" && "$disable_delete" == false ]]; then
  rsync_opts+=(--delete)
fi

if [[ "$dry_run" == true ]]; then
  rsync_opts+=(--dry-run)
fi

if [[ -n "$exclude_file" && -f "$exclude_file" ]]; then
  rsync_opts+=("--exclude-from=$exclude_file")
elif [[ -n "$exclude_file" ]]; then
  echo "[WARN] Exclude file '$exclude_file' not found; continuing without it" >&2
fi

rsync_cmd=(rsync "${rsync_opts[@]}")
if [[ ${#extra_rsync_args[@]} -gt 0 ]]; then
  rsync_cmd+=("${extra_rsync_args[@]}")
fi
rsync_cmd+=("$source_arg" "$dest_arg")

echo "[INFO] Direction: $direction"
if [[ "$direction" == "push" ]]; then
  echo "[INFO] Syncing $source_arg to $remote_spec"
else
  echo "[INFO] Syncing $remote_spec to $dest_arg"
fi
"${rsync_cmd[@]}"

echo "[INFO] Sync complete"
