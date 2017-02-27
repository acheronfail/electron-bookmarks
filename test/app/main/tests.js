module.exports = { do: test };

const fs = require('fs');
const electron = require('electron');
const bookmarks = require('electron-bookmarks');

const log = require('./log');
const { send, win } = require('./win');

// This path is sent from the renderer process (text input).
let testPath = '';
electron.ipcMain.on('updatePath', (e, path) => testPath = path);


const actions = {
  showOpenDialog: function (useBookmark, useWin) {
    log('showOpenDialog:win:' + useWin + ':bookmark:' + useBookmark);
    return new Promise(function(resolve, reject) {
      const dialog = useBookmark ? bookmarks : electron.dialog;
      dialog.showOpenDialog(useWin ? win : null, {}, (filenames, data) => {
        resolve({
          title: 'showOpenDialog',
          message: (
            useBookmark
              ? `paths:  ${filenames && filenames[0]}\ndata:  ${JSON.stringify(data, null, 2)}`
              : `paths:  ${filenames && filenames[0]}`
          ),
          useBookmark: useBookmark
        });
      }); // showOpenDialog
    }); // Promise
  },

  showSaveDialog: function (useBookmark, useWin) {
    log('showSaveDialog:win:' + useWin + ':bookmark:' + useBookmark);
    return new Promise(function(resolve, reject) {
      const dialog = useBookmark ? bookmarks : electron.dialog;
      dialog.showSaveDialog(useWin ? win : null, {}, (filename, data) => {
        resolve({
          title: 'showSaveDialog',
          message: (
            useBookmark
              ? `path:  ${filename}\ndata:  ${JSON.stringify(data, null, 2)}`
              : `path:  ${filename}`
          ),
          useBookmark: useBookmark
        });
      }); // showSaveDialog
    }); // Promise
  },

  read: (useBookmark)  => access('read', useBookmark),
  write: (useBookmark)  => access('write', useBookmark)
};

// Helper functions.

function access(type, useBookmark) {
  log(type + ':' + testPath + ':bookmark:' + useBookmark);
  const flags = fs.constants[type == 'read' ? 'R_OK' : 'W_OK'];

  return new Promise((resolve, reject) => {
    if (useBookmark) {
      const bookmark = bookmarks.list().find((b) => b.path == testPath);
      if (bookmark) {
        // Open the bookmark.
        bookmarks.open(bookmark.key, (allowedPath, close) => {
          log('Using bookmark: ' + bookmark.key);

          // Access the file now the bookmark is open.
          const res = testAccess(flags, testPath);

          // Make sure we close it!
          close();

          resolve({ title: type, message: res.message, error: res.error, useBookmark });
        });
      }
    }
    else {
      const res = testAccess(flags, testPath);
      resolve({ title: type, message: res.message, error: res.error, useBookmark });
    }
  }); // Promise
}


// Tests access to the given path.
function testAccess(flags, path) {
  try {
    fs.accessSync(path, flags);
    return { message: 'ACCESS OK: ' + path };
  }
  catch (err) {
    log.error({ message: err.message, stack: err.stack });
    return { message: 'ACCESS FAIL: ' + path, error: true };
  }
}


// Export.
function test(action, useBookmark, useWin) {
  actions[action](useBookmark, !!useWin).then((res) => {
    send('result', res);
  }).catch((err) => {
    send('result', { title: 'Error', error: true, message: err.message });
  });
}
