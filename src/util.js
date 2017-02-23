import $ from 'nodobjc';
import { app, BrowserWindow } from 'electron';


export const moduleKey = `electron-bookmarks::${app.getName()}::`;

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
  }
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
