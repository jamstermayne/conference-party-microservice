#!/usr/bin/env bash
# Shared library for design audit scripts

# Color definitions
C_RESET=$'\033[0m'
C_OK=$'\033[1;32m'
C_WARN=$'\033[1;33m'
C_ERR=$'\033[1;31m'
C_H1=$'\033[1;36m'
C_DIM=$'\033[2;37m'

# Helper functions
ok()   { printf "%s✔ %s%s\n" "$C_OK" "$*" "$C_RESET"; }
warn() { printf "%s⚠ %s%s\n" "$C_WARN" "$*" "$C_RESET"; }
err()  { printf "%s✘ %s%s\n" "$C_ERR" "$*" "$C_RESET"; }
h1()   { printf "\n%s=== %s ===%s\n" "$C_H1" "$*" "$C_RESET"; }
dim()  { printf "%s%s%s\n" "$C_DIM" "$*" "$C_RESET"; }

# Repository paths
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SRC_FE="$ROOT/frontend/src"
DIST_FE="$ROOT/frontend/dist"
CSS_DIR="$SRC_FE/assets/css"
JS_DIR="$SRC_FE/js"
PUBLIC_DIR="$ROOT/public"

# Production URLs
BASE_PROD="https://conference-party-app.web.app"
API_PROD="https://us-central1-conference-party-app.cloudfunctions.net/api"

# Export for use in scripts
export ROOT SRC_FE DIST_FE CSS_DIR JS_DIR PUBLIC_DIR BASE_PROD API_PROD
export -f ok warn err h1 dim