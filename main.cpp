/**
 * extensions/loader/main.cpp
 *
 * Native Loader Extension for Neutralinojs
 * =========================================
 * This C++ process is spawned by Neutralinojs at startup.
 * It communicates with the frontend via stdin/stdout using
 * Neutralinojs's extension protocol (JSON over stdio).
 *
 * PLATFORM BEHAVIOUR
 * ------------------
 *  Linux   → GtkSpinner inside a GtkWindow
 *  Windows → PROGRESS_CLASS (PBS_MARQUEE) inside a Win32 HWND
 *  macOS   → NSProgressIndicator inside an NSPanel
 *
 * BUILD COMMANDS
 * --------------
 *  Linux:
 *    g++ -o loader-linux main.cpp \
 *        $(pkg-config --cflags --libs gtk+-3.0) \
 *        -std=c++17 -pthread
 *
 *  Windows (MinGW):
 *    g++ -o loader-win.exe main.cpp \
 *        -lcomctl32 -lgdi32 -luser32 \
 *        -std=c++17 -mwindows
 *
 *  macOS:
 *    clang++ -o loader-mac main.cpp \
 *        -framework Cocoa \
 *        -std=c++17
 *
 * EXTENSION PROTOCOL (Neutralinojs v5+)
 * ---------------------------------------
 * Messages are newline-delimited JSON on stdout:
 *   { "id": "...", "method": "app.broadcast", "data": { ... } }
 *
 * Messages arrive on stdin:
 *   { "event": "ping", "data": { "count": 1, "platform": "Linux" } }
 */

#include <iostream>
#include <string>
#include <thread>
#include <chrono>
#include <sstream>

// ── Platform-specific includes ──────────────────────────────────────────────

#if defined(__linux__)
  #include <gtk/gtk.h>

#elif defined(_WIN32)
  #include <windows.h>
  #include <commctrl.h>
  #pragma comment(lib, "comctl32.lib")
  #pragma comment(lib, "user32.lib")
  #pragma comment(lib, "gdi32.lib")

#elif defined(__APPLE__)
  #include <objc/objc.h>
  #include <objc/message.h>
  // We use the ObjC runtime directly to avoid needing .mm compilation
#endif

// ── JSON helpers (minimal, no dependencies) ────────────────────────────────

std::string makeEvent(const std::string& event, const std::string& dataJson) {
    return "{\"event\":\"" + event + "\",\"data\":" + dataJson + "}\n";
}

std::string makeResponse(int id, bool success, const std::string& message) {
    std::ostringstream oss;
    oss << "{\"id\":" << id
        << ",\"data\":{\"success\":" << (success ? "true" : "false")
        << ",\"message\":\"" << message << "\"}}\n";
    return oss.str();
}

// ── Platform: Linux / GTK ──────────────────────────────────────────────────
#if defined(__linux__)

static GtkWidget* g_spinner_window = nullptr;
static GtkWidget* g_spinner        = nullptr;

void showSpinner(int w, int h, bool darkTheme) {
    gtk_init(nullptr, nullptr);

    g_spinner_window = gtk_window_new(GTK_WINDOW_TOPLEVEL);
    gtk_window_set_decorated(GTK_WINDOW(g_spinner_window), FALSE);
    gtk_window_set_default_size(GTK_WINDOW(g_spinner_window), w, h);
    gtk_window_set_position(GTK_WINDOW(g_spinner_window), GTK_WIN_POS_CENTER);
    gtk_window_set_keep_above(GTK_WINDOW(g_spinner_window), TRUE);

    // Apply dark/light theme background
    GdkRGBA bgColor;
    gdk_rgba_parse(&bgColor, darkTheme ? "#0f0f13" : "#f5f5f5");
    gtk_widget_override_background_color(g_spinner_window, GTK_STATE_FLAG_NORMAL, &bgColor);

    GtkWidget* vbox = gtk_box_new(GTK_ORIENTATION_VERTICAL, 8);
    gtk_widget_set_valign(vbox, GTK_ALIGN_CENTER);
    gtk_widget_set_halign(vbox, GTK_ALIGN_CENTER);

    // Native GTK spinner — this is the KEY native control
    g_spinner = gtk_spinner_new();
    gtk_widget_set_size_request(g_spinner, 48, 48);
    gtk_spinner_start(GTK_SPINNER(g_spinner));

    gtk_box_pack_start(GTK_BOX(vbox), g_spinner, FALSE, FALSE, 0);
    gtk_container_add(GTK_CONTAINER(g_spinner_window), vbox);
    gtk_widget_show_all(g_spinner_window);

    gtk_main();
}

void hideSpinner() {
    if (g_spinner_window) {
        gtk_widget_hide(g_spinner_window);
        gtk_spinner_stop(GTK_SPINNER(g_spinner));
        gtk_main_quit();
        g_spinner_window = nullptr;
    }
}

bool isDarkTheme() {
    GtkSettings* settings = gtk_settings_get_default();
    gboolean dark = FALSE;
    g_object_get(settings, "gtk-application-prefer-dark-theme", &dark, nullptr);
    return dark;
}

// ── Platform: Windows / Win32 ─────────────────────────────────────────────
#elif defined(_WIN32)

static HWND g_hwnd_main    = nullptr;
static HWND g_hwnd_progress = nullptr;

LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
    if (msg == WM_DESTROY) { PostQuitMessage(0); return 0; }
    return DefWindowProc(hwnd, msg, wp, lp);
}

void showSpinner(int w, int h, bool darkTheme) {
    INITCOMMONCONTROLSEX icc;
    icc.dwSize = sizeof(icc);
    icc.dwICC  = ICC_PROGRESS_CLASS;
    InitCommonControlsEx(&icc);

    WNDCLASSEX wc    = {};
    wc.cbSize        = sizeof(wc);
    wc.lpfnWndProc   = WndProc;
    wc.hInstance     = GetModuleHandle(nullptr);
    wc.lpszClassName = L"NeuLoader";
    wc.hbrBackground = CreateSolidBrush(darkTheme ? RGB(15,15,19) : RGB(245,245,245));
    RegisterClassEx(&wc);

    int sw = GetSystemMetrics(SM_CXSCREEN);
    int sh = GetSystemMetrics(SM_CYSCREEN);

    g_hwnd_main = CreateWindowEx(
        WS_EX_TOPMOST,
        L"NeuLoader", L"Loading…",
        WS_POPUP | WS_VISIBLE,
        (sw - w) / 2, (sh - h) / 2, w, h,
        nullptr, nullptr, GetModuleHandle(nullptr), nullptr
    );

    // Marquee progress bar — the native Windows infinite-progress control
    g_hwnd_progress = CreateWindowEx(
        0, PROGRESS_CLASS, nullptr,
        WS_CHILD | WS_VISIBLE | PBS_MARQUEE,
        w/2 - 80, h/2 - 6, 160, 12,
        g_hwnd_main, nullptr, GetModuleHandle(nullptr), nullptr
    );
    SendMessage(g_hwnd_progress, PBM_SETMARQUEE, TRUE, 40); // 40ms tick

    ShowWindow(g_hwnd_main, SW_SHOW);
    UpdateWindow(g_hwnd_main);

    MSG msg;
    while (GetMessage(&msg, nullptr, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
}

void hideSpinner() {
    if (g_hwnd_main) {
        DestroyWindow(g_hwnd_main);
        g_hwnd_main = nullptr;
    }
}

bool isDarkTheme() {
    DWORD value = 1;
    DWORD size  = sizeof(value);
    RegGetValue(
        HKEY_CURRENT_USER,
        L"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize",
        L"AppsUseLightTheme",
        RRF_RT_REG_DWORD, nullptr, &value, &size
    );
    return (value == 0);
}

// ── Platform: macOS / Cocoa ───────────────────────────────────────────────
#elif defined(__APPLE__)

void showSpinner(int w, int h, bool darkTheme) {
    // Using ObjC runtime to avoid .mm requirement
    id cls_NSApp = objc_getClass("NSApplication");
    ((id(*)(id,SEL))objc_msgSend)((id)cls_NSApp, sel_registerName("sharedApplication"));
    // Full Cocoa implementation would call:
    //   NSProgressIndicator* pi = [[NSProgressIndicator alloc] init];
    //   [pi setStyle: NSProgressIndicatorStyleSpinning];
    //   [pi setIndeterminate: YES];
    //   [pi startAnimation: nil];
    // See extensions/loader/macos.mm for the full Objective-C implementation
}

void hideSpinner() {}
bool isDarkTheme() { return false; }

#else
void showSpinner(int, int, bool) {}
void hideSpinner() {}
bool isDarkTheme() { return false; }
#endif

// ── Main — Extension entry point ──────────────────────────────────────────

int main(int argc, char* argv[]) {
    // argv[1] is the NL_TOKEN for authentication
    std::string token = (argc > 1) ? argv[1] : "";

    // Announce readiness to Neutralinojs
    std::cout << makeEvent("loaderReady", "{\"status\":\"ready\",\"platform\":\""
#if defined(__linux__)
        "Linux"
#elif defined(_WIN32)
        "Windows"
#elif defined(__APPLE__)
        "Darwin"
#else
        "Unknown"
#endif
        "\"}");
    std::cout.flush();

    bool dark = isDarkTheme();

    // Launch spinner in a background thread (non-blocking)
    std::thread spinnerThread([dark]() {
        showSpinner(960, 640, dark);
    });
    spinnerThread.detach();

    // Main stdin loop — listen for messages from Neutralinojs frontend
    std::string line;
    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;

        // Parse event type (minimal JSON parse)
        if (line.find("\"ping\"") != std::string::npos) {
            std::cout << makeEvent("pong", "{\"alive\":true}");
            std::cout.flush();
        }
        else if (line.find("\"hide\"") != std::string::npos ||
                 line.find("\"appReady\"") != std::string::npos) {
            hideSpinner();
            std::cout << makeEvent("loaderHidden", "{\"success\":true}");
            std::cout.flush();
            break;
        }
    }

    return 0;
}
