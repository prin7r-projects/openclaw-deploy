#!/usr/bin/env bash
# OpenClaw Deploy installer — placeholder for v1.0.
# The CLI binary `occ` will be installed here in a future release.

set -euo pipefail

cat <<'EOF'
[ openclaw-deploy ]

This installer is a placeholder for the v1.0 CLI binary `occ`.
The control plane API and CLI are scheduled for a follow-up wave.

For now:
  - source     : https://github.com/prin7r-projects/openclaw-deploy
  - docs       : https://github.com/prin7r-projects/openclaw-deploy/tree/main/docs
  - issues     : https://github.com/prin7r-projects/openclaw-deploy/issues

When the CLI ships, this script will install `occ` to ~/.local/bin
and verify your control plane connectivity.
EOF

exit 0
