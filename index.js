'use strict';
const electron = require('electron');

const app = electron.app;

//const remote = require('remote'); 
//const dialog = remote.require('dialog');
//const fs = require('fs');

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

// prevent window being garbage collected
let mainWindow;

function onClosed() {
	// dereference the window
	// for multiple windows store them in an array
	mainWindow = null;
}

function createMainWindow() {
	const win = new electron.BrowserWindow({
		width: 400,
		height: 400,
        titleBarStyle: 'hidden',
        resizable: false
//      titleBarStyle: 'hidden-inset'
//      transparent: true, frame: false
//        'standard-window': false
	});

	win.loadURL(`file://${__dirname}/app/index.html`);
	win.on('closed', onClosed);

	return win;
}

app.on('window-all-closed', () => {
//	if (process.platform !== 'darwin') {
		app.quit();
//	}
});

app.on('activate', () => {
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

app.on('ready', () => {
	mainWindow = createMainWindow();
});
