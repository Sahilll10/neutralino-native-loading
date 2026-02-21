# Native Loading Animation Demo — Research Prototype

> A research prototype exploring **native loading animations** for [Neutralinojs](https://neutralino.js.org) before the webview initialises.  
> Built as part of my GSoC 2026 application for the project idea: **"Rendering a native loading animation before loading the app"** (Issue [#814](https://github.com/neutralinojs/neutralinojs/issues/814)).

---

## 🎯 What Problem Does This Solve?

Neutralinojs renders app frontends using platform-specific webview components. For large frontends, remote URLs, or low-end devices, the webview takes time to initialise — leaving users staring at a **blank white screen**.

The current workaround (hiding the window until content loads) **delays the initial visible rendering time**, which hurts UX.

This prototype explores the full UX and technical flow of a native loading animation that runs *before* the webview, then hands off seamlessly when the app is ready.

---

## 🗂️ Project Structure

```
neutralino-native-loading/
├── neutralino.config.json          ← Config with proposed startupLoader block
├── build-extension.sh              ← Build script (Linux / macOS / Windows)
├── resources/
│   ├── index.html                  ← Main UI (shows after loader dismisses)
│   ├── styles/
│   │   └── main.css
│   └── js/
│       ├── loader.js               ← Simulates native loader init sequence
│       └── app.js                  ← All Neutralino API usage
└── extensions/
    └── loader/
        ├── main.cpp                ← C++ extension (Linux GTK + Windows Win32)
        └── macos.mm                ← Objective-C extension (macOS Cocoa)
```

---

## 🖥️ Native Controls Used Per Platform

| Platform | Native Control | API |
|---|---|---|
| **Linux** | `GtkSpinner` | `gtk_spinner_new()` — already in GTK3, no new dep |
| **Windows** | Progress Bar (PBS_MARQUEE) | `CreateWindowEx(PROGRESS_CLASS, PBS_MARQUEE)` |
| **macOS** | `NSProgressIndicator` | `[pi setStyle: NSProgressIndicatorStyleSpinning]` |

---

## ✨ Features Demonstrated

- **Platform detection** via `Neutralino.computer.getOsInfo()` — selects the correct native spinner label
- **Persistent settings** via `Neutralino.filesystem` — reads/writes `settings.json` to track first-run, launch count, and loader config
- **Filesystem API** — scans the resources directory (same API the real C++ loader will use to check for a custom `loader.gif`)
- **Extension protocol** — the C++ extension communicates via stdin/stdout; the JS layer can send `ping` → `pong`, `hide` → spinner dismissed
- **Theme detection** — reads OS dark/light mode to set spinner background (GTK, Win32 registry, Cocoa)
- **Proposed `neutralino.config.json` block** 

---

## 🚀 Quick Start

### Prerequisites

```bash
# Install Neutralinojs CLI
npm install -g @neutralinojs/neu

# Linux only: GTK3 dev headers
sudo apt install libgtk-3-dev build-essential g++

# macOS only: Xcode command line tools
xcode-select --install
```

### Run (browser mode — no build needed)

```bash
git clone https://github.com/Sahilll10/neutralino-native-loading.git
cd neutralino-native-loading
neu update       # download Neutralinojs binaries
neu run          # opens the app
```

### Build the native extension (optional, for full functionality)

```bash
chmod +x build-extension.sh
./build-extension.sh
neu run
```

---

## 🔧 How the Extension Protocol Works

```
Neutralinojs frontend (JS)          C++ Extension Process
         │                                    │
         │  ── spawn at startup ──────────►  │
         │                                    │  shows native spinner
         │  ◄── { event: "loaderReady" } ──  │
         │                                    │
         │  ... webview initialises ...       │
         │                                    │
         │  ── { event: "appReady"  } ──────► │
         │                                    │  hides spinner
         │  ◄── { event: "loaderHidden" } ── │
         │                                    │
         │  show main app UI                  │
```

---

## 📄 Proposed `neutralino.config.json` Addition

```json
"window": {
  "startupLoader": {
    "type": "system",
    "image": "/resources/images/loader.gif"
  }
}
```

| Value | Behaviour |
|---|---|
| `"none"` | No loader, current behaviour |
| `"system"` (default) | Platform-native spinner (GTK / Win32 / Cocoa) |
| `"image"` | Custom GIF or PNG from app resources |

---

## 🔗 Related

- **Issue:** [neutralinojs/neutralinojs#814](https://github.com/neutralinojs/neutralinojs/issues/814)
- **GSoC 2026 project ideas:** [neutralinojs/gsoc2026](https://github.com/neutralinojs/gsoc2026)
- **Neutralinojs docs:** [neutralino.js.org](https://neutralino.js.org)

---

## 👤 About This Project

Built by [@Sahilll10](https://github.com/Sahilll10) as a research prototype.
