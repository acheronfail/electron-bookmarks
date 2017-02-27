module.exports = { init, send };

const { BrowserWindow } = require('electron'),
      url = require('url'),
      path = require('path');


let mainWindow = null;

function init() {
  mainWindow = new BrowserWindow({
    show: true,
    width: 1024,
    height: 840
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '..', 'app.html'),
    protocol: 'file:',
    slashes: true
  }));

  mainWindow.on('close', function () {
    mainWindow = null;
    setImmediate(function () { process.exit(0); });
  });

  mainWindow.webContents.toggleDevTools({ mode: 'detach' });
}


function send(...args) {
  if (!mainWindow) return;

  mainWindow.webContents.send(...args);
}
