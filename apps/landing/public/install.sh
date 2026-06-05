#!/usr/bin/env bash
# OpenClaw Deploy — Cold Iron installer.
#
# Usage:
#   curl -fsSL https://openclaw-deploy.prin7r.com/install.sh | bash
#   curl -fsSL https://openclaw-deploy.prin7r.com/install.sh | bash -s -- install
#   curl -fsSL https://openclaw-deploy.prin7r.com/install.sh | bash -s -- --what-it-does
#
# Modes (default: smoke):
#   smoke       Verify the local toolchain + control-plane reachability,
#               then exit. This is what `curl | bash` runs by default and is
#               the only mode that touches the network on a fresh machine.
#   install     Install the `occ` CLI into ${PREFIX:-~/.local/bin}, wire up
#               the canonical Cold Iron config directory, then exit.
#               Will NOT start any OpenClaw agent runtime. That is gated
#               by docs/14-audit-cold-iron-t01.md and out of scope here.
#   dry-run     Print the steps the script would perform without touching
#               the filesystem or network. Use this to preview.
#
# Environment overrides:
#   COLD_IRON_INSTALL_DIR   Target directory for install mode (default: ~/.local).
#   COLD_IRON_API_URL       Control-plane API URL (default: https://openclaw-deploy.prin7r.com/api).
#   COLD_IRON_SITE_URL      Landing-site URL (default: https://openclaw-deploy.prin7r.com).
#   COLD_IRON_OCC_VERSION   Pin the `occ` version (default: latest tagged release).
#
# No live payment / KYC / legal action is performed. The installer is
# vendor-agnostic about the runtime that the operator wants to run.
set -euo pipefail

readonly BOLD='\033[1m'
readonly DIM='\033[2m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly RED='\033[0;31m'
readonly NC='\033[0m'

readonly SITE_URL="${COLD_IRON_SITE_URL:-https://openclaw-deploy.prin7r.com}"
readonly API_URL="${COLD_IRON_API_URL:-${SITE_URL%/}/api}"
readonly INSTALL_DIR="${COLD_IRON_INSTALL_DIR:-$HOME/.local}"
readonly OCC_BIN_DIR="${INSTALL_DIR%/}/bin"
readonly OCC_VERSION="${COLD_IRON_OCC_VERSION:-}"
readonly REPO_OWNER="prin7r-projects"
readonly REPO_NAME="openclaw-deploy"
readonly REPO="https://github.com/${REPO_OWNER}/${REPO_NAME}"
readonly RELEASE_API="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest"

MODE="smoke"
WHAT_IT_DOES=0
while [ $# -gt 0 ]; do
  case "$1" in
    smoke|install|dry-run) MODE="$1"; shift ;;
    --what-it-does|-n) WHAT_IT_DOES=1; shift ;;
    -h|--help)
      sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "[Error] unknown arg: $1" >&2; exit 64 ;;
  esac
done

log()   { echo -e "${GREEN}[cold-iron]${NC} $1"; }
note()  { echo -e "${DIM}[cold-iron]${NC} $1"; }
warn()  { echo -e "${YELLOW}[warning]${NC} $1"; }
fail()  { echo -e "${RED}[error]${NC} $1" >&2; exit 1; }

require() {
  local cmd="$1"
  local install_hint="${2:-}"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    if [ -n "$install_hint" ]; then
      fail "missing required command: ${cmd}. ${install_hint}"
    else
      fail "missing required command: ${cmd}"
    fi
  fi
}

# Check whether a network resource is reachable. We deliberately do NOT
# spawn a long-lived background curl on the smoke path so `curl | bash`
# cannot hang on a captive portal / offline machine.
probe() {
  local url="$1"
  local code
  code="$(curl -fsS --max-time 6 -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || true)"
  if [ -z "$code" ] || [ "$code" = "000" ]; then
    echo "000"
  else
    echo "$code"
  fi
}

detect_occ_target() {
  local os arch
  os="$(uname -s 2>/dev/null || echo unknown)"
  arch="$(uname -m 2>/dev/null || echo unknown)"
  case "${os}:${arch}" in
    Linux:x86_64)  echo "linux-x64"  ;;
    Linux:aarch64) echo "linux-arm64" ;;
    Darwin:x86_64) echo "darwin-x64"  ;;
    Darwin:arm64)  echo "darwin-arm64" ;;
    *) return 1 ;;
  esac
}

resolve_occ_version() {
  if [ -n "$OCC_VERSION" ]; then
    echo "$OCC_VERSION"
    return 0
  fi
  # Best-effort. If GitHub rate-limits us we fall through to "v0".
  local body
  if ! body="$(curl -fsS --max-time 6 "$RELEASE_API" 2>/dev/null)"; then
    return 1
  fi
  echo "$body" \
    | sed -n 's/.*"tag_name":[[:space:]]*"\([^"]*\)".*/\1/p' \
    | head -n1
}

# ----- preflight ------------------------------------------------------------
preflight() {
  require curl "Install curl from https://curl.se/"
  require tar
  # node is required for the standalone `occ` binary; the bundled binary
  # in the repo (`apps/occ/dist/occ`) is a Bun single-file executable
  # that we re-ship via the release artifact.
  if ! command -v node >/dev/null 2>&1; then
    warn "node is not on PATH. The `occ` CLI needs Node 20+. Install: https://nodejs.org/"
  fi
}

# ----- what-it-does (preview) ----------------------------------------------
print_plan() {
  cat <<EOF
[ cold-iron ] install plan (mode=${MODE})

  step 1 · preflight
    verify: curl, tar $(command -v node >/dev/null 2>&1 && echo ", node")
  step 2 · probe control plane
    GET  ${API_URL%/}/healthz         (expected 200)
    GET  ${SITE_URL%/}/robots.txt     (expected 200)
EOF
  case "$MODE" in
    smoke)
      cat <<EOF
  step 3 · smoke report
    print: occ version target
    print: deploy package paths
    exit 0 (no filesystem changes beyond tmp)
EOF
      ;;
    install)
      cat <<EOF
  step 3 · resolve occ version
    GET  ${RELEASE_API}
    pick: ${OCC_VERSION:-latest}
  step 4 · install occ
    mkdir ${OCC_BIN_DIR}
    download: occ-<target>.tar.gz from the matching GitHub release
    extract occ into ${OCC_BIN_DIR}
  step 5 · verify
    occ --version
    occ status --probe ${API_URL}  (read-only healthcheck)
  step 6 · write config
    ${INSTALL_DIR%/}/etc/coldiron/config.json
    API_URL=${API_URL}
EOF
      ;;
    dry-run)
      cat <<EOF
  step 3 · (no-op; this is the dry-run)
EOF
      ;;
  esac
  echo
  echo "  No live payment / KYC / bank / legal action is performed."
  echo "  No OpenClaw agent runtime is started by this script."
}

# ----- smoke mode -----------------------------------------------------------
run_smoke() {
  preflight
  echo
  log "OpenClaw Deploy — Cold Iron installer (smoke mode)"
  echo
  note "verifying toolchain..."
  require curl
  require tar
  log "  curl, tar: present"
  if command -v node >/dev/null 2>&1; then
    log "  node: $(node --version)"
  else
    warn "  node: missing (occ CLI will not run locally)"
  fi

  echo
  note "probing control plane (read-only)..."
  local code_health code_robots
  code_health="$(probe "${API_URL%/}/healthz" || true)"
  code_robots="$(probe "${SITE_URL%/}/robots.txt" || true)"
  log "  GET ${API_URL%/}/healthz         -> ${code_health}"
  log "  GET ${SITE_URL%/}/robots.txt     -> ${code_robots}"

  if [ "$code_health" != "200" ]; then
    warn "control plane is not reachable on this network; the installer is still safe to re-run later"
  fi

  echo
  note "deploy package paths (canonical)..."
  cat <<EOF
  installer:        ${SITE_URL%/}/install.sh
  source:           ${REPO}
  docs:             ${REPO}/tree/main/docs
  occ CLI:          \`curl -fsSL ${SITE_URL%/}/install.sh | bash -s -- install\`
  occ (manual):     download from ${REPO}/releases
  deploy package:   ${REPO}/raw/main/patches/PRI-5506/cold-iron-deploy-package.tar.gz
EOF

  echo
  local target=""
  if target="$(detect_occ_target 2>/dev/null)"; then
    log "occ binary target (this host): ${target}"
  else
    warn "could not detect host target for occ (uname returned: $(uname -sm 2>/dev/null))"
  fi

  if [ -n "${target:-}" ]; then
    if version="$(resolve_occ_version 2>/dev/null)"; then
      log "latest occ release tag:         ${version}"
    else
      warn "could not resolve latest occ release tag (network or rate limit)"
    fi
  fi

  echo
  log "${BOLD}smoke complete.${NC}"
  echo
  echo "  Next steps:"
  echo "    1. Review the deploy package at  ${REPO}/tree/main/docs"
  echo "    2. To install the occ CLI:        curl -fsSL ${SITE_URL%/}/install.sh | bash -s -- install"
  echo "    3. To run a no-network preview:   curl -fsSL ${SITE_URL%/}/install.sh | bash -s -- --what-it-does"
  echo
}

# ----- install mode ---------------------------------------------------------
run_install() {
  preflight
  local target=""
  if ! target="$(detect_occ_target)"; then
    fail "unsupported host (uname: $(uname -sm 2>/dev/null)). The occ CLI ships for linux-x64, linux-arm64, darwin-x64, darwin-arm64."
  fi

  local version="${OCC_VERSION:-}"
  if [ -z "$version" ]; then
    if ! version="$(resolve_occ_version)"; then
      fail "could not resolve the latest occ release tag. Set COLD_IRON_OCC_VERSION=vX.Y.Z to pin, or check network/GitHub rate limits."
    fi
  fi
  log "installing occ ${version} (${target}) into ${OCC_BIN_DIR}"

  local tarball="occ-${target}.tar.gz"
  local url="${REPO}/releases/download/${version}/${tarball}"
  local tmp
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT

  note "downloading ${url}"
  if ! curl -fsSL --max-time 60 -o "${tmp}/${tarball}" "$url"; then
    fail "download failed. Check that ${version} has a ${tarball} asset on the GitHub release, or pin COLD_IRON_OCC_VERSION to a published tag."
  fi

  mkdir -p "$OCC_BIN_DIR"
  if ! tar -xzf "${tmp}/${tarball}" -C "$OCC_BIN_DIR"; then
    fail "tar extract failed for ${tarball}. The release asset may be corrupt; re-download or pin a different version."
  fi
  chmod 0755 "${OCC_BIN_DIR}/occ" 2>/dev/null || true

  local occ_path="${OCC_BIN_DIR}/occ"
  if [ ! -x "$occ_path" ]; then
    fail "occ binary was not extracted to ${occ_path}. Inspect ${tmp} and re-run."
  fi

  log "occ installed: $occ_path"
  "$occ_path" --version || warn "occ --version exited non-zero (binary present, but did not respond)"

  # Persist the API URL. The CLI reads ~/.coldiron/config.json; we put the
  # binary in ~/.local/bin per the XDG-ish convention.
  local cfg_dir="${INSTALL_DIR%/}/etc/coldiron"
  mkdir -p "$cfg_dir"
  cat > "${cfg_dir}/config.json" <<EOF
{
  "apiUrl": "${API_URL}",
  "siteUrl": "${SITE_URL}",
  "installedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "occVersion": "${version}",
  "occTarget": "${target}"
}
EOF

  echo
  log "${BOLD}install complete.${NC}"
  echo
  echo "  occ:    ${occ_path}"
  echo "  config: ${cfg_dir}/config.json"
  echo
  echo "  Add to PATH if not already:"
  echo "    export PATH=\"${OCC_BIN_DIR}:\$PATH\""
  echo
  echo "  Smoke check:"
  echo "    occ --version"
  echo "    curl -fsS ${SITE_URL%/}/healthz"
  echo
  echo "  No live payment / KYC / bank / legal action was performed."
  echo "  No OpenClaw agent runtime was started by this script."
}

# ----- dry-run mode ---------------------------------------------------------
run_dry_run() {
  print_plan
  echo
  log "${BOLD}dry-run complete. No filesystem or network changes were made.${NC}"
}

# ----- main -----------------------------------------------------------------
echo
if [ "$WHAT_IT_DOES" -eq 1 ]; then
  print_plan
  exit 0
fi

case "$MODE" in
  smoke)     run_smoke ;;
  install)   run_install ;;
  dry-run)   run_dry_run ;;
  *)         fail "unknown mode: $MODE" ;;
esac
