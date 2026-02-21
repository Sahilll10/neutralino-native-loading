/**
 * app.js
 *
 * Demonstrates Neutralinojs APIs relevant to the GSoC loading-animation project:
 *  • Neutralino.computer   — OS detection
 *  • Neutralino.filesystem — read/write settings.json, list resources
 *  • Neutralino.os         — environment variables, execute native commands
 *  • Neutralino.extensions — send/receive messages with C++ extension
 *  • Neutralino.window     — hide/show the window (current workaround for white screen)
 */

/* ── Bootstrap Neutralino ──────────────────────────────── */
Neutralino.init();

Neutralino.events.on('ready', async () => {
  // Start the loader sequence; app UI is shown after NeuLoader.run() resolves
  await NeuLoader.run();
});

/* ── After loader dismisses ────────────────────────────── */
document.addEventListener('neuloader:ready', async (e) => {
  const { os, control, version, duration } = e.detail;

  // Header bar
  document.getElementById('header-info').textContent =
    `${os} ${version ?? ''} · init in ${duration}ms`;

  // Hero platform chips
  const row = document.getElementById('platform-info-row');
  row.innerHTML = `
    <div class="info-chip"><span class="chip-dot"></span>${os}</div>
    <div class="info-chip"><span class="chip-dot" style="background:#6c63ff;box-shadow:0 0 6px #6c63ff"></span>Native control: ${control}</div>
    <div class="info-chip"><span class="chip-dot" style="background:#fbbf24;box-shadow:0 0 6px #fbbf24"></span>Ready in ${duration}ms</div>
  `;

  // Run all sections in parallel
  await Promise.all([
    loadOsInfo(os, control),
    loadSettings(),
    loadFileList(),
  ]);
});

/* ─────────────────────────────────────────────────────────
   1. OS INFO CARD
   ───────────────────────────────────────────────────────── */
async function loadOsInfo(os, control) {
  const el = document.getElementById('os-snippet');

  const platformMap = {
    Linux:   {
      api:   'GtkSpinner — gtk_spinner_new()',
      color: '#34d399',
      note:  'Already a GTK3 dependency, zero overhead',
    },
    Windows: {
      api:   'CreateWindowEx(PROGRESS_CLASS, PBS_MARQUEE)',
      color: '#60a5fa',
      note:  'Win32 API, no extra DLL required',
    },
    Darwin:  {
      api:   '[NSProgressIndicator startAnimation:nil]',
      color: '#f472b6',
      note:  'Cocoa — part of AppKit framework',
    },
  };

  const info = platformMap[os] ?? {
    api: 'System default spinner',
    color: '#a78bfa',
    note: 'Unknown platform',
  };

  el.style.color = info.color;
  el.innerHTML   = `<strong>${control}</strong><br>${info.api}<br><small style="color:#7a7a8e">${info.note}</small>`;
}

/* ─────────────────────────────────────────────────────────
   2. PERSISTENT SETTINGS (settings.json)
   ───────────────────────────────────────────────────────── */
const SETTINGS_PATH = `${NL_PATH}/.storage/loader-settings.json`;

const DEFAULT_SETTINGS = {
  showSplashScreen: true,
  loaderType: 'system',          // 'none' | 'system' | 'image'
  customImage: '',               // e.g. '/resources/images/loader.gif'
  launchCount: 0,
  firstLaunchDate: new Date().toISOString(),
  lastLaunchDate:  new Date().toISOString(),
};

async function loadSettings() {
  const el  = document.getElementById('settings-display');
  const btn = document.getElementById('btn-reset-settings');

  try {
    // Ensure storage directory exists
    try { await Neutralino.filesystem.createDirectory(`${NL_PATH}/.storage`); }
    catch { /* already exists */ }

    let settings;
    try {
      const raw  = await Neutralino.filesystem.readFile(SETTINGS_PATH);
      settings   = JSON.parse(raw);
      settings.launchCount++;
      settings.lastLaunchDate = new Date().toISOString();
      await Neutralino.filesystem.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2));
    } catch {
      // First launch — write defaults
      settings = { ...DEFAULT_SETTINGS };
      await Neutralino.filesystem.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2));
    }

    window._currentSettings = settings;
    el.textContent = JSON.stringify(settings, null, 2);
  } catch (err) {
    el.textContent = `Error: ${err.message ?? err}`;
    el.style.color = '#f87171';
  }

  btn.addEventListener('click', async () => {
    try {
      await Neutralino.filesystem.writeFile(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
      window._currentSettings = { ...DEFAULT_SETTINGS };
      el.textContent = JSON.stringify(DEFAULT_SETTINGS, null, 2);
      el.style.color = '#fbbf24';
      setTimeout(() => el.style.color = '', 800);
    } catch (err) {
      el.textContent = `Reset failed: ${err.message}`;
    }
  });
}

/* ─────────────────────────────────────────────────────────
   3. FILE LIST (resources directory scan)
   ───────────────────────────────────────────────────────── */
async function loadFileList() {
  const el = document.getElementById('file-list');
  try {
    const entries = await Neutralino.filesystem.readDirectory(`${NL_PATH}/resources`);
    const lines = entries
      .filter(e => e.type === 'FILE')
      .map(e => `📄 ${e.entry}`)
      .join('\n');
    el.textContent = lines || 'No files found.';
  } catch (err) {
    // Neutralino might restrict path access in browser mode
    el.textContent = '(filesystem restricted in browser mode)';
  }
}

/* ─────────────────────────────────────────────────────────
   4. NATIVE EXTENSION PING SIMULATION
   ───────────────────────────────────────────────────────── */
let extPingCount = 0;

document.getElementById('btn-simulate-ext').addEventListener('click', async () => {
  const statusEl = document.getElementById('ext-status');
  extPingCount++;

  statusEl.innerHTML = `<span class="dot dot-yellow"></span> Sending message to loader extension…`;

  try {
    // Real extension call (works only when extension process is running)
    // The C++ extension listens on stdin and responds with spinner state
    await Neutralino.extensions.dispatch(
      'js.neutralino.nativeLoader',
      'ping',
      { count: extPingCount, platform: window._detectedOS }
    );
    statusEl.innerHTML = `<span class="dot dot-green"></span> Extension replied (ping #${extPingCount})`;
  } catch {
    // Graceful degradation — extension not running (expected in demo)
    await new Promise(r => setTimeout(r, 600));
    statusEl.innerHTML =
      `<span class="dot dot-green"></span> Simulated reply — ping #${extPingCount} ` +
      `[ platform=${window._detectedOS}, control=${window._nativeControl} ]`;
  }

  setTimeout(() => {
    statusEl.innerHTML =
      `<span class="dot dot-yellow"></span> Extension channel open (simulated)`;
  }, 3000);
});

/* ─────────────────────────────────────────────────────────
   5. CONFIG PREVIEW
   ───────────────────────────────────────────────────────── */
document.getElementById('config-code').textContent = `{
  "applicationId": "js.neutralino.nativeLoaderDemo",
  "version": "1.0.0",
  "defaultMode": "window",
  "documentRoot": "/resources/",
  "url": "/index.html",

  "window": {
    "title": "NeuLoader Demo",
    "width": 960,
    "height": 640,
    "minWidth": 600,
    "minHeight": 400,

    "startupLoader": {
      "type": "system",
      "image": "/resources/images/loader.gif"
    }
  },

  "extensions": [
    {
      "id": "js.neutralino.nativeLoader",
      "command": "extensions/loader/loader ${NL_TOKEN}",
      "commandLinux":   "extensions/loader/loader-linux ${NL_TOKEN}",
      "commandWindows": "extensions/loader/loader-win.exe ${NL_TOKEN}",
      "commandDarwin":  "extensions/loader/loader-mac ${NL_TOKEN}"
    }
  ]
}`;

/* ── Window close handler ──────────────────────────────── */
Neutralino.events.on('windowClose', () => Neutralino.app.exit());
