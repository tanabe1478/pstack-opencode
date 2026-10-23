#!/bin/sh
set -eu

usage() {
  cat <<'EOF'
Uninstall pstack from OpenCode.

Usage: ./uninstall.sh [--project] [--force]

  --project  remove from ./.opencode instead of the global config directory
  --force    remove pstack-owned files even when they are not symlinks into this checkout

By default only symlinks that point into this checkout are removed.
EOF
}

project=0
force=0
for arg in "$@"; do
  case "$arg" in
    --project) project=1 ;;
    --force) force=1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown option: $arg" >&2; usage >&2; exit 2 ;;
  esac
done

src=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

if [ "$project" -eq 1 ]; then
  target=$(pwd)/.opencode
else
  target=${OPENCODE_CONFIG_DIR:-${XDG_CONFIG_HOME:-$HOME/.config}/opencode}
fi

remove_one() {
  path=$1
  [ -e "$path" ] || [ -L "$path" ] || return 0
  if [ -L "$path" ]; then
    case "$(readlink "$path")" in
      "$src"/*) rm -f "$path"; return 0 ;;
    esac
  fi
  if [ "$force" -eq 1 ]; then
    rm -rf "$path"
  else
    echo "skip not owned by this checkout: $path" >&2
  fi
}

for entry in "$src"/skills/*; do
  [ -d "$entry" ] || continue
  remove_one "$target/skills/$(basename "$entry")"
done

for entry in "$src"/agents/*.md; do
  [ -f "$entry" ] || continue
  remove_one "$target/agents/$(basename "$entry")"
done

for entry in "$src"/commands/*.md; do
  [ -f "$entry" ] || continue
  remove_one "$target/commands/$(basename "$entry")"
done

remove_one "$target/plugins/pstack.ts"
remove_one "$target/hooks/session-start.md"

if [ "$force" -eq 1 ]; then
  rm -f "$target/pstack-models.md"
fi

echo "uninstalled pstack from $target"
