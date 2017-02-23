var electron = require('electron'),
    fs = require('fs'),
    url = require('url'),
    path = require('path');

// Keep a global reference of the window object, if we don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

electron.app.on('ready', function () {
  console.log('App is ready!');
  initWindow();

  const ipc = require('./main/ipc.js');
  ipc.init();
});


function initWindow() {
  mainWindow = new electron.BrowserWindow({ show: true });
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'app.html'),
    protocol: 'file:',
    slashes: true
  }));

  mainWindow.on('close', function () {
    mainWindow = null;
    setImmediate(function () { process.exit(0); });
  });

  mainWindow.webContents.toggleDevTools({ mode: 'detach' });
}
