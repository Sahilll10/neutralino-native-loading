/**
 * extensions/loader/macos.mm
 *
 * macOS-specific native loading animation
 * Full Objective-C implementation using Cocoa / AppKit
 *
 * Compile:
 *   clang++ -o loader-mac macos.mm \
 *       -framework Cocoa -std=c++17
 */

#import <Cocoa/Cocoa.h>
#include <iostream>
#include <string>
#include <thread>

static NSWindow*            g_window   = nil;
static NSProgressIndicator* g_spinner  = nil;

// Detect macOS dark/light mode
static bool isDarkMode() {
    NSAppearance* appearance = [NSApp effectiveAppearance];
    NSAppearanceName name = [appearance
        bestMatchFromAppearancesWithNames:@[
            NSAppearanceNameAqua,
            NSAppearanceNameDarkAqua
        ]];
    return [name isEqualToString:NSAppearanceNameDarkAqua];
}

static void showNativeSpinner(int width, int height) {
    bool dark = isDarkMode();

    // Create a borderless panel (sits above the main window)
    g_window = [[NSPanel alloc]
        initWithContentRect: NSMakeRect(0, 0, width, height)
        styleMask:           NSWindowStyleMaskBorderless
        backing:             NSBackingStoreBuffered
        defer:               NO];

    [g_window setLevel: NSFloatingWindowLevel];
    [g_window center];
    [g_window setBackgroundColor:
        dark ? [NSColor colorWithRed:0.059 green:0.059 blue:0.075 alpha:1.0]
             : [NSColor whiteColor]];

    // Native Cocoa spinning indicator
    g_spinner = [[NSProgressIndicator alloc]
        initWithFrame: NSMakeRect(
            width/2.0 - 24, height/2.0 - 24, 48, 48
        )];
    [g_spinner setStyle: NSProgressIndicatorStyleSpinning];
    [g_spinner setIndeterminate: YES];
    [g_spinner setControlSize: NSControlSizeLarge];

    // Respect dark mode — spinner tint
    if (dark) {
        [g_spinner setAppearance:
            [NSAppearance appearanceNamed: NSAppearanceNameDarkAqua]];
    }

    [[g_window contentView] addSubview: g_spinner];
    [g_spinner startAnimation: nil];
    [g_window makeKeyAndOrderFront: nil];
    [NSApp run];
}

static void hideNativeSpinner() {
    dispatch_async(dispatch_get_main_queue(), ^{
        if (g_spinner) [g_spinner stopAnimation: nil];
        if (g_window)  [g_window orderOut: nil];
        [NSApp terminate: nil];
    });
}

int main(int argc, const char* argv[]) {
    [NSApplication sharedApplication];

    std::cout << "{\"event\":\"loaderReady\","
                 "\"data\":{\"status\":\"ready\",\"platform\":\"Darwin\"}}\n";
    std::cout.flush();

    // Spinner runs on main thread (required by Cocoa)
    std::thread inputThread([]{
        std::string line;
        while (std::getline(std::cin, line)) {
            if (line.find("\"hide\"") != std::string::npos ||
                line.find("\"appReady\"") != std::string::npos) {
                hideNativeSpinner();
                break;
            }
            if (line.find("\"ping\"") != std::string::npos) {
                std::cout << "{\"event\":\"pong\",\"data\":{\"alive\":true}}\n";
                std::cout.flush();
            }
        }
    });
    inputThread.detach();

    // NSApp run loop must be on main thread
    showNativeSpinner(960, 640);
    return 0;
}
