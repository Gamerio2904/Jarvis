#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
cd "$ROOT/frontend"
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
APK="app/build/outputs/apk/debug/app-debug.apk"
mkdir -p "$ROOT/releases"
cp -f "$APK" "$ROOT/releases/jarvis-0.9.3-debug.apk"
echo "APK: $ROOT/releases/jarvis-0.9.3-debug.apk"
ls -lh "$ROOT/releases/jarvis-0.9.3-debug.apk"
