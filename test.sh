#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$(mktemp -d /tmp/visage-test.XXXXXX)"
cleanup() { rm -rf "$BUILD_DIR"; }
trap cleanup EXIT

cp -a "$ROOT/src" "$ROOT/test" "$ROOT/package.json" "$ROOT/tsconfig.json" "$ROOT/vitest.config.ts" "$BUILD_DIR/"
cd "$BUILD_DIR"
npm install
npm test
