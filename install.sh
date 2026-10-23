#!/bin/sh
set -eu

usage() {
  cat <<'EOF'
Install pstack for OpenCode.

Usage: ./install.sh [--project] [--copy] [--force]

  --project  install into ./.opencode instead of the global config directory
  --copy     copy files instead of symlinking them
  --force    replace existing symlinks and files owned by this install

The global target is ${OPENCODE_CONFIG_DIR:-${XDG_CONFIG_HOME:-$HOME/.config}/opencode}.
No file is overwritten unless it is a symlink into this checkout or --force is used.
EOF
}

project=0
copy=0
force=0
for arg in "$@"; do
  case "$arg" in
    --project) project=1 ;;
    --copy) copy=1 ;;
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

mkdir -p "$target/skills" "$target/agents" "$target/commands" "$target/plugins" "$target/hooks"

install_one() {
  from=$1
  to=$2
  if [ -e "$to" ] || [ -L "$to" ]; then
    if [ -L "$to" ] && [ "$(readlink "$to")" = "$from" ]; then
      return 0
    fi
    if [ "$force" -eq 1 ]; then
      rm -rf "$to"
    else
      echo "skip existing: $to" >&2
      return 0
    fi
  fi
  if [ "$copy" -eq 1 ]; then
    cp -R "$from" "$to"
  else
    ln -s "$from" "$to"
  fi
}

for entry in "$src"/skills/*; do
  [ -d "$entry" ] || continue
  install_one "$entry" "$target/skills/$(basename "$entry")"
done

for entry in "$src"/agents/*.md; do
  [ -f "$entry" ] || continue
  install_one "$entry" "$target/agents/$(basename "$entry")"
done

for entry in "$src"/commands/*.md; do
  [ -f "$entry" ] || continue
  install_one "$entry" "$target/commands/$(basename "$entry")"
done

install_one "$src/plugins/pstack.ts" "$target/plugins/pstack.ts"
install_one "$src/hooks/session-start.md" "$target/hooks/session-start.md"

if [ ! -e "$target/pstack-models.md" ]; then
  cp "$src/examples/pstack-models.md" "$target/pstack-models.md"
  echo "wrote $target/pstack-models.md"
fi

echo "installed pstack into $target"
echo "next: start a new OpenCode session, run /setup-pstack, then /poteto-mode"
