#include <windows.h>
#include <commctrl.h>

#pragma comment(lib, "comctl32.lib")

#pragma comment(linker, \
"\"/manifestdependency:type='win32' \
name='Microsoft.Windows.Common-Controls' \
version='6.0.0.0' processorArchitecture='*' \
publicKeyToken='6595b64144ccf1df' language='*'\"")

int WINAPI WinMain(HINSTANCE hInst, HINSTANCE, LPSTR, int nCmdShow) {
    INITCOMMONCONTROLSEX icex = { sizeof(icex), ICC_PROGRESS_CLASS };
    InitCommonControlsEx(&icex);

    HWND hwnd = CreateWindowEx(
        0,
        WC_STATIC,
        L"Loading",
        WS_OVERLAPPEDWINDOW | WS_VISIBLE,
        CW_USEDEFAULT, CW_USEDEFAULT,
        300, 120,
        NULL, NULL, hInst, NULL
    );

    HWND hProgress = CreateWindowEx(
        0,
        PROGRESS_CLASS,
        NULL,
        WS_CHILD | WS_VISIBLE | PBS_MARQUEE,
        20, 40, 260, 20,
        hwnd, NULL, hInst, NULL
    );

    SendMessage(hProgress, PBM_SETMARQUEE, TRUE, 50);

    ShowWindow(hwnd, SW_SHOW);
    UpdateWindow(hwnd);

    Sleep(3000);

    return 0;
}