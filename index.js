'use strict';
const electron = require('electron');
const app = electron.app;

//console.log(app.getPath('userData'))

require('electron-debug')({showDevTools: true});



// prevent window being garbage collected
let mainWindow;

function onClosed() {
  // dereference the window
  mainWindow = null;
  
  //delete the temporary folder (not working on build)
  var fs = require('fs-extra')
  fs.removeSync(app.getPath('userData')+"/tmp");
  console.log('>> cleanup done')
}

function createMainWindow() {
  const win = new electron.BrowserWindow({
    width: 400,
    height: 400,
    title: "Pro-File",
    resizable: false,
    fullscreen: false,
//    frame: false,
//    titleBarStyle: 'hidden',
//    resizable: false,
//    titleBarStyle: 'hidden-inset',
//    transparent: true, frame: false,
//    'standard-window': false
  });
  win.setTitle(require('./package.json').name);
  win.loadURL(`file://${__dirname}/app/index.html`);
  win.on('closed', onClosed);
  return win;
}

app.on('window-all-closed', () => {
//  if (process.platform !== 'darwin') {app.quit();}
  app.quit();
});

app.on('activate', () => {
  if (!mainWindow) {
    mainWindow = createMainWindow();
  }
});

app.on('ready', () => {
  mainWindow = createMainWindow();
});