# 📘 COMPLETE SETUP GUIDE
# From zero → cloning Neutralinojs → building your demo → pushing to GitHub

# ═══════════════════════════════════════════════════════
# STEP 1 — INSTALL PREREQUISITES
# ═══════════════════════════════════════════════════════

# ── Node.js (v18 or higher) ──────────────────────────────
# Download from https://nodejs.org  OR:
# Linux (Ubuntu/Debian):
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# macOS (with Homebrew):
brew install node

# Windows: download installer from nodejs.org
# Verify:
node --version   # should show v18+ or v20+
npm --version


# ── Neutralinojs CLI ─────────────────────────────────────
npm install -g @neutralinojs/neu
neu --version    # should show 10.x or higher


# ── C++ compiler (for building the native extension) ─────
# Linux:
sudo apt install build-essential g++ libgtk-3-dev cmake
# Verify:
g++ --version

# macOS:
xcode-select --install
# Verify:
clang++ --version

# Windows (MinGW-w64):
# Download from: https://www.mingw-w64.org/downloads/
# OR install with Chocolatey: choco install mingw


# ═══════════════════════════════════════════════════════
# STEP 2 — CLONE AND BUILD NEUTRALINOJS FROM SOURCE
# (Optional but HIGHLY recommended for the GSoC application)
# ═══════════════════════════════════════════════════════

# Clone the main framework repo
git clone https://github.com/neutralinojs/neutralinojs.git
cd neutralinojs

# Linux: install additional deps
sudo apt install libwebkit2gtk-4.1-dev ninja-build cmake

# Build from source
cmake -DCMAKE_BUILD_TYPE=Release -B build -G Ninja
cmake --build build

# You should now have: ./build/neutralino
# Run the test/sample app to confirm it works:
./build/neutralino --load-dir-res --path=. --mode=window

# Go back to your projects directory
cd ..


# ═══════════════════════════════════════════════════════
# STEP 3 — CLONE THIS DEMO APP
# ═══════════════════════════════════════════════════════

git clone https://github.com/Sahilll10/neutralino-native-loading.git
cd neutralino-native-loading

# Download Neutralinojs binaries (framework server + client)
neu update
# This downloads:
#   neutralino-linux64    (or neutralino-mac / neutralino-win.exe)
#   WebSocket client JS lib


# ═══════════════════════════════════════════════════════
# STEP 4 — RUN THE APP (quick mode, no extension build)
# ═══════════════════════════════════════════════════════

neu run
# Opens a desktop window showing the loading animation demo
# The native extension ping will be simulated in JS (graceful fallback)


# ═══════════════════════════════════════════════════════
# STEP 5 — BUILD THE NATIVE C++ EXTENSION (full mode)
# ═══════════════════════════════════════════════════════

chmod +x build-extension.sh
./build-extension.sh

# This compiles extensions/loader/main.cpp into:
#   Linux:   extensions/loader/loader-linux
#   macOS:   extensions/loader/loader-mac
#   Windows: extensions/loader/loader-win.exe

# Run again — this time the real native spinner will appear
neu run


# ═══════════════════════════════════════════════════════
# STEP 6 — RUN IN BROWSER MODE (for screenshots / sharing)
# ═══════════════════════════════════════════════════════

neu run --mode=browser
# Opens http://localhost:5050 in your browser
# Great for screenshotting the loading animation for your proposal


# ═══════════════════════════════════════════════════════
# STEP 7 — UNDERSTAND WHAT EACH FILE DOES
# ═══════════════════════════════════════════════════════

# resources/js/loader.js
#   → Simulates the 7-stage loading sequence
#   → Uses Neutralino.computer.getOsInfo() to detect platform
#   → Drives the progress bar + step labels
#   → Dispatches 'neuloader:ready' event when done

# resources/js/app.js
#   → Called after loader dismisses
#   → Reads/writes settings.json via Neutralino.filesystem
#   → Scans resources dir via Neutralino.filesystem.readDirectory
#   → Sends messages to C++ extension via Neutralino.extensions.dispatch
#   → Builds the config preview and platform info chips

# extensions/loader/main.cpp
#   → C++ process spawned at startup
#   → Shows GtkSpinner (Linux), PBS_MARQUEE (Windows), or calls Cocoa (macOS)
#   → Communicates via stdin/stdout JSON protocol
#   → Hides when it receives { event: "appReady" }

# neutralino.config.json
#   → Contains the proposed "startupLoader" block (window section)
#   → Defines the extension registration


# ═══════════════════════════════════════════════════════
# STEP 8 — PUSH TO YOUR GITHUB (if forking or extending)
# ═══════════════════════════════════════════════════════

# Initialize git (if you created a fresh directory)
git init
git add .
git commit -m "feat: initial native loading animation demo for GSoC 2026"

# Add your remote
git remote add origin https://github.com/Sahilll10/neutralino-native-loading.git

# Push
git branch -M main
git push -u origin main


# ═══════════════════════════════════════════════════════
# STEP 9 — EXPLORE THE NEUTRALINOJS SOURCE (important!)
# ═══════════════════════════════════════════════════════

cd neutralinojs   # your clone from Step 2

# Files most relevant to the loading animation project:
#   src/server/neuserver.cpp        → app startup, where loader hook goes
#   src/settings.cpp                → config parsing (add startupLoader here)
#   lib/webview/webview.h           → webview initialisation
#   neutralinojs.cpp                → main entry point

# Read these files and note:
#   1. Where the window is created
#   2. Where the webview is initialised
#   3. Where config is first parsed
# The loader must appear BETWEEN window creation and webview init.
