const { app } = require('electron');
const $ = require('nodobjc');


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
