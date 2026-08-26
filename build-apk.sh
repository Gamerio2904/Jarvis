#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

ROOT="$(pwd)"
FRONT="$ROOT/frontend"
OUT="$FRONT/dist-apk"
APK_SRC="$FRONT/android/app/build/outputs/apk/debug/app-debug.apk"

if [[ -z "${ANDROID_HOME:-}" && -d "$HOME/Android/Sdk" ]]; then
  export ANDROID_HOME="$HOME/Android/Sdk"
fi
if [[ -n "${ANDROID_HOME:-}" ]]; then
  export ANDROID_SDK_ROOT="$ANDROID_HOME"
fi

echo
echo " Jarvis APK Build (on-device)"
echo " ----------------------------"

command -v node >/dev/null
command -v java >/dev/null

pushd "$FRONT" >/dev/null
npm install
npm run build
if [[ ! -f android/gradlew ]]; then
  npx cap add android
fi
npx cap sync android
node scripts/apply-native-tv.mjs
popd >/dev/null

pushd "$FRONT/android" >/dev/null
chmod +x gradlew
./gradlew assembleDebug --no-daemon
popd >/dev/null

if [[ ! -f "$APK_SRC" ]]; then
  echo "[!] APK nicht gefunden: $APK_SRC" >&2
  exit 1
fi
mkdir -p "$OUT" "$ROOT/releases"
cp -f "$APK_SRC" "$OUT/jarvis-debug.apk"
cp -f "$APK_SRC" "$ROOT/releases/Jarvis.apk"
echo
echo " Fertig: $OUT/jarvis-debug.apk"
echo " Sideload: $ROOT/releases/Jarvis.apk"
