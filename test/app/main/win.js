module.exports = { init, send, win: null };

const { BrowserWindow } = require('electron'),
      url = require('url'),
      path = require('path');


let mainWindow = null;

function init() {
  mainWindow = module.exports.win = new BrowserWindow({
    show: true,
    width: 1024,
    height: 880
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

  mainWindow.webContents.toggleDevTools();
}


function send(...args) {
  if (!mainWindow) return;

  mainWindow.webContents.send(...args);
}
