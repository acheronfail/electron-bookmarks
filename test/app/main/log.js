module.exports = log;
module.exports.error = error;

/**
 * In the main electron process, we do not use console.log() statements because they do
 * not show up in a convenient location when running the packaged (i.e. production)
 * version of the app. Instead use this module, which sends the logs to the main window
 * where they can be viewed in Developer Tools.
 */

const win = require('./win');
const { app } = require('electron');


function log(...args) {
  if (app.ipcReady) {
    win.send('log', ...args);
  }
  else {
    app.once('ipcReady', () => win.send('log', ...args));
  }
}

function error(...args) {
  if (app.ipcReady) {
    win.send('error', ...args);
  }
  else {
    app.once('ipcReady', () => win.send('error', ...args));
  }
}
