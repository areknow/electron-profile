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



//receive the package from the render process and create modal
const ipc = require('electron').ipcMain
ipc.on('open-modal', function (event, arg) {
  createModalWindow(arg);
})
//create new modals for each system profile
function createModalWindow(arg) {
  var path = require('path')
  var modalPath = path.join('file://', __dirname, 'app/modal.html')
  var modal = new electron.BrowserWindow({
    width: 400,
    height: 721,
    'minWidth': 300,
  });
  modal.on('close', function () { modal = null })
  modal.loadURL(modalPath)
  modal.show()
  //pass argument values to the new modal
  modal.webContents.on('did-finish-load', () => {
    modal.webContents.send('ping', arg)
  })
  
  
}



