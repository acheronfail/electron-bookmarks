const $ = require('nodobjc');

// Get electron objects whether in main or renderer process.
let electron = require('electron');
if (electron.remote) electron = electron.remote;
const { app, BrowserWindow } = electron;


module.exports.moduleKey = `electron-bookmarks::${app.getName()}::`;

/**
 * [checkImports description]
 */
module.exports.checkImports = function checkImports() {
  if (
    !('NSOpenPanel' in $) ||
    !('NSSavePanel' in $) ||
    !('NSUserDefaults') in $
  ) {
    $.import('AppKit');
  }
}


/**
 * [checkAppInitialized description]
 */
module.exports.checkAppInitialized = function checkAppInitialized() {
  if (!process.mas) {
    throw new Error('electron-bookmarks must run within a signed, mas-packaged electron application.');
  }

  if (!app.isReady()) {
    throw new Error('electron-bookmarks can only be used after app is ready.');
  }
}


/**
 * [checkArguments description]
 */
module.exports.checkArguments = function checkArguments(win, opts, cb) {
  // Shift.
  if (win != null && win.constructor != BrowserWindow) {
    [cb, opts, win] = [opts, win, null];
  }

  // Shift.
  if ((cb == null) && typeof opts == 'function') {
    [cb, opts] = [opts, null];
  }

  // Fallback to using very last argument as the callback function.
  const last = arguments[arguments.length - 1];
  if ((cb == null) && typeof last == 'function') {
    cb = last;
  }
}
