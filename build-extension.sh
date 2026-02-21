#!/usr/bin/env bash
# ============================================================
#  build-extension.sh
#  Builds the native loader extension for the current platform
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$SCRIPT_DIR/extensions/loader"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   NeuLoader Extension Builder                    ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

OS=$(uname -s)

case "$OS" in
  Linux)
    echo "▶ Building for Linux (GTK3)..."
    pkg-config --exists gtk+-3.0 || {
      echo "ERROR: libgtk-3-dev not found."
      echo "Install it: sudo apt install libgtk-3-dev"
      exit 1
    }
    g++ -o "$OUT_DIR/loader-linux" "$OUT_DIR/main.cpp" \
        $(pkg-config --cflags --libs gtk+-3.0) \
        -std=c++17 -pthread -O2
    echo "✓ Built: extensions/loader/loader-linux"
    ;;

  Darwin)
    echo "▶ Building for macOS (Cocoa)..."
    clang++ -o "$OUT_DIR/loader-mac" "$OUT_DIR/macos.mm" \
        -framework Cocoa -std=c++17 -O2
    echo "✓ Built: extensions/loader/loader-mac"
    ;;

  MINGW*|MSYS*|CYGWIN*)
    echo "▶ Building for Windows (Win32)..."
    g++ -o "$OUT_DIR/loader-win.exe" "$OUT_DIR/main.cpp" \
        -lcomctl32 -lgdi32 -luser32 \
        -std=c++17 -mwindows -O2
    echo "✓ Built: extensions/loader/loader-win.exe"
    ;;

  *)
    echo "ERROR: Unsupported platform: $OS"
    exit 1
    ;;
esac

echo ""
echo "✅ Build complete!"
echo ""
echo "Now run the demo app:"
echo "  cd $(basename $SCRIPT_DIR)"
echo "  neu run"
echo ""
