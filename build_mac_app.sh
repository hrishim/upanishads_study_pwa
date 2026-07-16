#!/bin/bash
set -euo pipefail

APP_NAME="Upanishads Study"
BUNDLE="$APP_NAME.app"
EXEC_NAME="UpanishadsStudy"
ROOT="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$ROOT/build"
APP_DIR="$BUILD_DIR/$BUNDLE"

node "$ROOT/scripts/generate-standalone-data.mjs"

rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/Contents/MacOS" "$APP_DIR/Contents/Resources"

TMP_ARM="$BUILD_DIR/${EXEC_NAME}-arm64"
TMP_X86="$BUILD_DIR/${EXEC_NAME}-x86_64"

swiftc -target arm64-apple-macos12 "$ROOT/Sources/main.swift" \
  -o "$TMP_ARM" \
  -framework Cocoa -framework WebKit

swiftc -target x86_64-apple-macos12 "$ROOT/Sources/main.swift" \
  -o "$TMP_X86" \
  -framework Cocoa -framework WebKit

lipo -create "$TMP_ARM" "$TMP_X86" -output "$APP_DIR/Contents/MacOS/$EXEC_NAME"
rm -f "$TMP_ARM" "$TMP_X86"

cp -R "$ROOT/WebApp" "$APP_DIR/Contents/Resources/WebApp"

cat > "$APP_DIR/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>Upanishads Study</string>
  <key>CFBundleDisplayName</key>
  <string>Upanishads Study</string>
  <key>CFBundleExecutable</key>
  <string>$EXEC_NAME</string>
  <key>CFBundleIdentifier</key>
  <string>local.upanishads.study</string>
  <key>CFBundleVersion</key>
  <string>1.0</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>LSMinimumSystemVersion</key>
  <string>12.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
PLIST

chmod +x "$APP_DIR/Contents/MacOS/$EXEC_NAME"
xattr -cr "$APP_DIR" 2>/dev/null || true

echo "Built: $APP_DIR"
