module.exports = { do: test };

const fs = require('fs');
const electron = require('electron');
const bookmarks = require('electron-bookmarks');

const log = require('./log');
const { send } = require('./win');

let lastPath = '';

const actions = {
  showOpenDialog: function (useBookmark) {
    log('showOpenDialog:bookmark:' + useBookmark);
    return new Promise(function(resolve, reject) {
      const dialog = useBookmark ? bookmarks : electron.dialog;
      dialog.showOpenDialog(null, {}, (filenames, data) => {
        lastPath = filenames && filenames[0];
        resolve({
          title: 'showOpenDialog',
          message: (
            useBookmark
              ? `paths:  ${filename}\ndata:  ${JSON.stringify(data, null, 2)}`
              : `paths:  ${filename}`
          ),
          useBookmark: useBookmark
        });
      }); // showOpenDialog
    }); // Promise
  },

  // TODO: "Scoped bookmarks can only be created for existing files or directories"
  //      -- you initially have access!
  //        So create an empty file or folder ?
  showSaveDialog: function (useBookmark) {
    log('showSaveDialog:bookmark:' + useBookmark);
    return new Promise(function(resolve, reject) {
      const dialog = useBookmark ? bookmarks : electron.dialog;
      dialog.showSaveDialog(null, {}, (filename, data) => {
        lastPath = filename;
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

  read: function (useBookmark) {
    log('read:bookmark:' + useBookmark);
    return new Promise.resolve({
      title: 'read',
      message: testAccess(fs.constants.R_OK, lastPath),
      useBookmark: useBookmark
    });
  },

  write: function (useBookmark) {
    log('write:bookmark:' + useBookmark);
    return new Promise.resolve({
      title: 'write',
      message: testAccess(fs.constants.W_OK, lastPath),
      useBookmark: useBookmark
    });
  }
};

// Helper functions.
function testAccess(perms, path) {
  try {
    fs.accessSync(path, perms);
    return 'ACCESS WRITE: OK';
  }
  catch (err) {
    log.error({ message: err.message, stack: err.stack });
    return 'ACCESS WRITE: FAIL';
  }
}


// Export.
function test(action, useBookmark) {
  actions[action](useBookmark).then((res) => {
    send('result', res);
  }).catch((err) => {
    send('result', { title: 'Error', error: true, message: err.message });
  });
}
