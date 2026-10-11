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
find "$S" -name __pycache__ -prune -exec rm -rf {} +
(cd release/stage && python3 -m zipfile -c ../decky-system-monitor.zip decky-system-monitor)
rm -rf release/stage
echo "release/decky-system-monitor.zip"
