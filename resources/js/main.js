
function showInfo() {
    document.getElementById('info').innerHTML =
     `${NL_APPID} is running on port ${NL_PORT}      inside ${NL_OS}
        <br/><br/>
        <span>server: v${NL_VERSION} . client: v${NL_CVERSION}</span>`;
}
function openDocs() {
    Neutralino.os.open("https://neutralino.js.org/docs");
}

function openTutorial() {
    Neutralino.os.open("https://www.youtube.com/c/CodeZri");
}


// checks if the application is running in window mode.
function setTray() {
    // Tray menu is only avl in window mode
    if(NL_MODE != "window") {
        console.log("INFO: Tray menu is only available in the window mode.");
        return;
    }
    let tray = {
        icon: "/resources/icons/trayIcon.png",
        menuItems: [
            {id: "VERSION", text: "Get version"},
            {id: "SEP", text: "-"},
            {id: "QUIT", text: "Quit"}
        ]
    };
    // We set the Tray
    Neutralino.os.setTray(tray);
}

// Function to handle click events on the tray menu.
function onTrayMenuItemClicked(event) {
    switch(event.detail.id) {
        case "VERSION":
            Neutralino.os.showMessageBox("Version information",
                `Neutralinojs server: v${NL_VERSION} | Neutralinojs client: v${NL_CVERSION}`);
            break;
        case "QUIT":

            Neutralino.app.exit();
            break;
    }
}


function onWindowClose() {
    Neutralino.app.exit();
}

Neutralino.init();

//Event Listener
Neutralino.events.on("trayMenuItemClicked", onTrayMenuItemClicked);
Neutralino.events.on("windowClose", onWindowClose);

//Set up system tray if not running on macOS
if(NL_OS != "Darwin") { //Fix https://github.com/neutralinojs/neutralinojs/issues/615
    setTray();
}

showInfo();
