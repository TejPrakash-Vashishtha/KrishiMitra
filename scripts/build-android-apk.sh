#!/usr/bin/env bash
# ============================================================
# KrishiMitra — Android release build script
# Produces a signed release APK at public/downloads/KrishiMitra.apk.
#
# Prerequisites (already true in the dev workspace):
#   - JDK 17, Android SDK (local.properties), node_modules
# Usage: sh ./scripts/build-android-apk.sh
# ============================================================
set -euo pipefail

cd "$(dirname "$0")/.."

KEYSTORE_FILE="android/app/krishimitra-release.jks"
KEYSTORE_PASS="krishimitra2026"
KEY_ALIAS="krishimitra"

# 1. Generate the release keystore once (idempotent).
if [ ! -f "$KEYSTORE_FILE" ]; then
  echo "==> Generating release keystore..."
  keytool -genkeypair -v \
    -keystore "$KEYSTORE_FILE" \
    -storepass "$KEYSTORE_PASS" \
    -keypass "$KEYSTORE_PASS" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10950 \
    -dname "CN=KrishiMitra, OU=AgriNexus, O=KrishiMitra, L=Lucknow, ST=Uttar Pradesh, C=IN"
fi

# 2. Install web deps if missing.
if [ ! -d node_modules ]; then
  echo "==> Installing web dependencies..."
  bun install
fi

# 3. Build the web assets and copy them into the Android project.
echo "==> Building web assets..."
bun run build

echo "==> Capacitor sync (copy + update)..."
bun x cap sync android

# 4. Build the signed release APK via Gradle.
echo "==> Building signed release APK..."
(cd android && ./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file="$(pwd)/app/krishimitra-release.jks" \
  -Pandroid.injected.signing.store.password="$KEYSTORE_PASS" \
  -Pandroid.injected.signing.key.alias="$KEY_ALIAS" \
  -Pandroid.injected.signing.key.password="$KEYSTORE_PASS")

# 5. Copy the artifact next to the website for the download button.
mkdir -p public/downloads
cp android/app/build/outputs/apk/release/app-release.apk public/downloads/KrishiMitra.apk
echo "==> Done: public/downloads/KrishiMitra.apk"
