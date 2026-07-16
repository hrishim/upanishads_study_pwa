#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BUILD_ROOT="$ROOT/build"
BUILD_DIR="$BUILD_ROOT/PWA/UpanishadsStudy_PWA"
UPLOAD_DIR="$BUILD_ROOT/GitHubPagesUpload/upanishads"

node "$ROOT/scripts/generate-standalone-data.mjs"

rm -rf "$BUILD_DIR" "$UPLOAD_DIR"
mkdir -p "$BUILD_DIR" "$UPLOAD_DIR"

cp -R "$ROOT/WebApp/." "$BUILD_DIR/"
cp -R "$ROOT/WebApp/." "$UPLOAD_DIR/"

(cd "$BUILD_ROOT/PWA" && zip -qr "$BUILD_ROOT/UpanishadsStudy_PWA.zip" "UpanishadsStudy_PWA")
(cd "$BUILD_ROOT/GitHubPagesUpload" && zip -qr "$BUILD_ROOT/UpanishadsStudy_GitHubPagesUpload.zip" "upanishads")

echo "Built PWA folder: $BUILD_DIR"
echo "Built GitHub Pages folder: $UPLOAD_DIR"
echo "Built zip: $BUILD_ROOT/UpanishadsStudy_PWA.zip"
echo "Built zip: $BUILD_ROOT/UpanishadsStudy_GitHubPagesUpload.zip"
