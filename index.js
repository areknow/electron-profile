'use strict';
const electron = require('electron');
const app = electron.app;
const ipc = require('electron').ipcMain

// prevent window being garbage collected
let mainWindow;
var count = 0;

function onClosed() {
  count = 0;
  // dereference the window
  mainWindow = null;
}

function createMainWindow() {
  const win = new electron.BrowserWindow({
    width: 400,
    height: 400,
    title: "Pro-File",
    resizable: false,
    backgroundColor: '#f0f0f0'
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



//delete the temporary folder
ipc.on('clear-tmp', function (event, arg) {
  var fs = require('fs-extra')
  fs.removeSync(app.getPath('userData')+"/tmp");
  console.log('>> cleanup done')
})

//receive the package from the render process and create modal
ipc.on('open-modal', function (event, arg) {
  createModalWindow(arg);
})

//create new modals for each system profile
function createModalWindow(arg) {
  var winMod = count*20
  var path = require('path')
  var modalPath = path.join('file://', __dirname, 'app/modal.html')
  var modal = new electron.BrowserWindow({
    width: 400,
    height: 721,
    'minWidth': 305,
    'minHeight': 305,
  });
  modal.on('close', function () { 
    modal = null;
    count = 0;
  })
  modal.loadURL(modalPath)
  modal.setPosition(100+winMod, 50+winMod)
  modal.show()
  //pass argument values to the new modal
  modal.webContents.on('did-finish-load', () => {
    modal.webContents.send('ping', arg)
  })
  count++;
}



//require('electron-debug')({showDevTools: true});