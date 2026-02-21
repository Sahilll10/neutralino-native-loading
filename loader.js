/**
 * loader.js
 *
 * Simulates the exact sequence a native C++ startup loader would follow:
 *  1. Read neutralino.config.json (startupLoader block)
 *  2. Detect OS & apply correct native spinner label
 *  3. Run staged init steps with progress
 *  4. Dismiss loader, reveal app
 *
 * In the real GSoC implementation these steps happen in C++ BEFORE the
 * webview is even created. This JS demo shows the UX flow and APIs used.
 */

window.NeuLoader = (function () {

  const overlay   = document.getElementById('native-loader');
  const fillEl    = document.getElementById('progress-fill');
  const stepEl    = document.getElementById('loader-step');
  const badgeEl   = document.getElementById('platform-badge');

  // Steps mirror what the C++ code will actually do
  const STEPS = [
    { label: 'Reading neutralino.config.json…',   pct: 10, ms: 350 },
    { label: 'Detecting OS & theme…',              pct: 25, ms: 300 },
    { label: 'Checking startup loader config…',    pct: 40, ms: 300 },
    { label: 'Preloading app resources…',          pct: 60, ms: 400 },
    { label: 'Reading persistent settings…',       pct: 75, ms: 350 },
    { label: 'Initialising webview context…',      pct: 88, ms: 400 },
    { label: 'Frontend ready — handing off…',      pct: 100, ms: 300 },
  ];

  async function _setStep(label, pct) {
    stepEl.textContent  = label;
    fillEl.style.width  = pct + '%';
    await _sleep(STEPS.find(s => s.label === label)?.ms ?? 300);
  }

  function _sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  async function run() {
    // Mark start time so we can report total load duration
    const t0 = performance.now();

    // Detect OS from Neutralino (or fall back to navigator.platform)
    let osLabel = 'Detecting OS…';
    try {
      const info = await Neutralino.computer.getOsInfo();
      const osMap = {
        Linux:   { label: 'Linux  ·  GTK GtkSpinner',          native: 'GtkSpinner' },
        Windows: { label: 'Windows  ·  Win32 PBS_MARQUEE',     native: 'PBS_MARQUEE' },
        Darwin:  { label: 'macOS  ·  Cocoa NSProgressIndicator', native: 'NSProgressIndicator' },
      };
      const entry = osMap[info.name] ?? { label: info.name, native: 'System Spinner' };
      osLabel = entry.label;
      window._detectedOS     = info.name;
      window._nativeControl  = entry.native;
      window._osVersion      = info.version;
    } catch {
      window._detectedOS = 'Unknown';
      window._nativeControl = 'System Spinner';
    }

    badgeEl.textContent = osLabel;

    // Run staged progress steps
    for (const step of STEPS) {
      await _setStep(step.label, step.pct);
    }

    // Record total init time for display in the app
    window._initDuration = Math.round(performance.now() - t0);

    // Fade out loader
    overlay.classList.add('fade-out');
    await _sleep(420);
    overlay.style.display = 'none';

    // Show main app
    document.getElementById('app').classList.remove('hidden');

    // Notify app.js that init is complete
    document.dispatchEvent(new CustomEvent('neuloader:ready', {
      detail: {
        os:       window._detectedOS,
        control:  window._nativeControl,
        version:  window._osVersion,
        duration: window._initDuration,
      }
    }));
  }

  return { run };
})();
