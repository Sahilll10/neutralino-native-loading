# Neutralino Native Loading Demo

This repository contains an early-stage experimental prototype that
explores showing a small platform-native loading window before a
Neutralino application UI loads.

This is **not a finished feature**.\
It is a learning and research prototype created to understand how native
extensions can be integrated with Neutralino.

------------------------------------------------------------------------

## Current Implementation

At the moment, this project includes:

-   A Windows native loading window built using Win32 API
-   A marquee-style progress bar using `PROGRESS_CLASS`
-   A simple auto-close behavior after a few seconds
-   Basic integration structure with a Neutralino project

The implementation is minimal and intended for experimentation.

------------------------------------------------------------------------

## What Is Not Implemented Yet

This project still needs significant improvements:

-   No real synchronization between loader and actual app readiness
-   No detection of real loading state
-   No Linux implementation
-   No macOS implementation
-   No production packaging workflow
-   No automated tests
-   No extension lifecycle refinement

This repository should be considered a proof-of-concept.

------------------------------------------------------------------------

## Purpose

The goal of this prototype is to explore:

-   How Neutralino native extensions work
-   Whether a native pre-loader improves startup experience
-   Cross-platform approaches for native UI components
-   Practical limitations of this approach

This is part of ongoing experimentation and learning.

------------------------------------------------------------------------

## Project Structure

    extensions/
      spinner_win.cpp        # Windows native loader source
    resources/
      index.html
      styles.css
      js/
    neutralino.config.json

------------------------------------------------------------------------

## How to Run

Make sure Neutralino CLI is installed.

To run the app:

    neu run

To manually compile the Windows loader:

    cl /EHsc /DUNICODE /D_UNICODE extensions\spinner_win.cpp /link comctl32.lib user32.lib

You must use the Visual Studio Developer Command Prompt for compilation.

------------------------------------------------------------------------

## Future Improvements

Planned next steps include:

-   Implement Linux and macOS native loaders
-   Connect loader visibility to real app initialization events
-   Improve project structure and packaging
-   Add documentation for cross-platform builds
-   Refine extension lifecycle handling

------------------------------------------------------------------------

## Status

This project is experimental and incomplete.

Feedback, suggestions, and discussions are welcome.
