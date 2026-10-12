#!/usr/bin/env bash
# Builds release/decky-system-monitor.zip (Decky "install from ZIP" layout).
set -euo pipefail
cd "$(dirname "$0")/.."
pnpm build
rm -rf release && mkdir -p release/stage/decky-system-monitor/dist
S=release/stage/decky-system-monitor
cp plugin.json package.json main.py LICENSE "$S/"
cp -r py_modules "$S/"
cp dist/index.js "$S/dist/"
# Build identity (specs/009 REQ-652): lets the plugin tell builds of the same version apart.
node -e 'const v=require("./package.json").version;require("fs").writeFileSync(process.argv[1],JSON.stringify({version:v,commit:process.env.GITHUB_SHA||process.argv[2]})+"\n")' "$S/build.json" "$(git rev-parse HEAD 2>/dev/null || echo unknown)"
find "$S" -name __pycache__ -prune -exec rm -rf {} +
(cd release/stage && python3 -m zipfile -c ../decky-system-monitor.zip decky-system-monitor)
rm -rf release/stage
echo "release/decky-system-monitor.zip"
