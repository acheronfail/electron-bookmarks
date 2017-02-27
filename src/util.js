import fs from 'fs';
import $ from 'nodobjc';
import { app, BrowserWindow } from 'electron';

checkAppInitialized();

export const moduleKey = `electron-bookmarks::${app.getName()}::`;

/**
 * [init description]
 */
export function init() {
  checkAppInitialized();
  return checkImports();
}

/**
 * [checkImports description]
 */
export function checkImports() {
  if (
    !('NSOpenPanel' in $) ||
    !('NSSavePanel' in $) ||
    !('NSUserDefaults') in $
  ) {
    $.import('AppKit');
    return true;
  }

  return false;
}


/**
 * [checkAppInitialized description]
 */
export function checkAppInitialized() {
  if (process.platform != 'darwin') {
    throw new Error('electron-bookmarks can only run on a darwin system.');
  }

  if (!process.mas) {
    throw new Error('electron-bookmarks must run within a signed, mas-packaged electron application.');
  }

  if (require('is-electron-renderer')) {
    throw new Error("electron-bookmarks cannot run in electron's renderer process. Please run it in the main process only.");
  }

  if (!app.isReady()) {
    throw new Error('electron-bookmarks can only be used after app is ready.');
  }
}

/**
 * Checks if a file or directory exists.
 */
export function exists(path, callback) {
  fs.stat(path, (err, s) => {
    if (err && err.code == 'ENOENT') {
      callback(null, false);
    }
    else {
      callback(err, err ? null : s.isFile() || s.isDirectory());
    }
  });
}


/**
 * [checkArguments description]
 */
export function checkArguments(win, opts, cb) {
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
